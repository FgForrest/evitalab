<script setup lang="ts">
/**
 * The hub of the catalog preview: one row per entity collection, expandable into its storage split and index
 * breakdown, click-through to the entity viewer and the schema viewer.
 *
 * **This table is not part of the polled refresh.** The catalog-level collection inventory holds no statistics at
 * all, so every populated column below costs one collection-level call *per row* — and those pull `STORAGE_SIZE`,
 * which is bounded IO. A catalog with fifty collections would otherwise issue fifty IO-bearing calls every five
 * seconds. It therefore loads once, and again only on an explicit reload.
 */

import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { List as ImmutableList } from 'immutable'
import VLoadingCircular from '@/modules/base/component/VLoadingCircular.vue'
import VMissingDataIndicator from '@/modules/base/component/VMissingDataIndicator.vue'
import { useWorkspaceService, WorkspaceService } from '@/modules/workspace/service/WorkspaceService'
import {
    EntityViewerTabFactory,
    useEntityViewerTabFactory
} from '@/modules/entity-viewer/viewer/workspace/service/EntityViewerTabFactory'
import {
    SchemaViewerTabFactory,
    useSchemaViewerTabFactory
} from '@/modules/schema-viewer/viewer/workspace/service/SchemaViewerTabFactory'
import { EntitySchemaPointer } from '@/modules/schema-viewer/viewer/model/EntitySchemaPointer'
import { CollectionInfo } from '@/modules/database-driver/request-response/statistics/CollectionInfo'
import {
    EntityCollectionStatisticsSnapshot
} from '@/modules/database-driver/request-response/statistics/EntityCollectionStatisticsSnapshot'
import {
    CollectionIndexSummary
} from '@/modules/database-driver/request-response/statistics/CollectionIndexSummary'
import { catalogViewerComponents } from '@/modules/catalog-viewer/service/CatalogViewerService'
import { useCollectionSnapshots } from '@/modules/catalog-viewer/composable/useCollectionSnapshots'
import { CatalogViewerPage } from '@/modules/catalog-viewer/model/CatalogViewerPage'
import CollectionStorageBar from '@/modules/catalog-viewer/component/overview/CollectionStorageBar.vue'
import IndexSummaryTable from '@/modules/catalog-viewer/component/indexes/IndexSummaryTable.vue'
import {
    formatBytes,
    formatDateTime,
    formatNumber,
    notApplicable
} from '@/modules/catalog-viewer/service/statisticsFormatting'

const workspaceService: WorkspaceService = useWorkspaceService()
const entityViewerTabFactory: EntityViewerTabFactory = useEntityViewerTabFactory()
const schemaViewerTabFactory: SchemaViewerTabFactory = useSchemaViewerTabFactory()
const { t } = useI18n()

const props = defineProps<{
    catalogName: string
    /**
     * The collection inventory of the catalog-level snapshot; `undefined` while the snapshot is still loading or
     * when the `COLLECTIONS` component could not be delivered.
     */
    collections: ImmutableList<CollectionInfo> | undefined
    reloadToken: number
}>()
const emit = defineEmits<{
    (e: 'openPage', page: CatalogViewerPage, entityType?: string): void
}>()

/**
 * One table row: the collection, its own snapshot, and the two sortable projections of it.
 *
 * The projections are materialised on the row rather than derived in a sort comparator, because Vuetify sorts by
 * the item's own property — and a collection whose size the engine does not report must sort as unknown, not as
 * zero.
 */
interface CollectionRow {
    readonly entityType: string
    readonly snapshot: EntityCollectionStatisticsSnapshot
    readonly size: number | undefined
    readonly indexes: number | undefined
}

/**
 * The shared per-collection fan-out: one collection-level snapshot per row, swapped over whole once all have
 * answered, so the table never blinks on a reload and is never half-populated.
 */
const { snapshots, loading } = useCollectionSnapshots(
    () => props.catalogName,
    () => props.collections,
    catalogViewerComponents.overviewCollectionRow,
    () => props.reloadToken,
    'catalogViewer.overview.collections.notification.couldNotLoad'
)

const rows = computed<CollectionRow[]>(() =>
    Array.from(snapshots.value, ([entityType, snapshot]): CollectionRow => ({
        entityType,
        snapshot,
        size: snapshot.storageSize != undefined
            ? Number(snapshot.storageSize.sizeOnDiskInBytes)
            : undefined,
        indexes: snapshot.indexSummary?.totalIndexCount
    }))
)

const expanded = ref<string[]>([])

const headers = computed(() => [
    { title: t('catalogViewer.overview.collections.column.entityType'), key: 'entityType' },
    { title: t('catalogViewer.overview.collections.column.records'), key: 'records', sortable: false },
    { title: t('catalogViewer.overview.collections.column.size'), key: 'size' },
    { title: t('catalogViewer.overview.collections.column.indexes'), key: 'indexes' },
    { title: t('catalogViewer.overview.collections.column.lastModified'), key: 'lastModified', sortable: false }
])

const headerDescriptions: Record<string, string> = {
    entityType: t('catalogViewer.overview.collections.help.entityType'),
    records: t('catalogViewer.overview.collections.help.records'),
    size: t('catalogViewer.overview.collections.help.size'),
    indexes: t('catalogViewer.overview.collections.help.indexes'),
    lastModified: t('catalogViewer.overview.collections.help.lastModified')
}

function openEntities(entityType: string): void {
    workspaceService.createTab(
        entityViewerTabFactory.createNew(props.catalogName, entityType, undefined, true)
    )
}

function openSchema(entityType: string): void {
    workspaceService.createTab(
        schemaViewerTabFactory.createNew(new EntitySchemaPointer(props.catalogName, entityType))
    )
}

function hasIndexes(row: CollectionRow): boolean {
    const summary: CollectionIndexSummary | undefined = row.snapshot.indexSummary
    return summary != undefined && !summary.byTypeAndScope.isEmpty()
}

function recordsLabel(row: CollectionRow): string {
    const counts = row.snapshot.recordCounts
    if (counts == undefined) {
        return notApplicable()
    }
    return t('catalogViewer.overview.collections.value.records', {
        live: formatNumber(counts.liveRecords),
        archived: formatNumber(counts.archivedRecords)
    })
}
</script>

<template>
    <div class="collections-table">
        <VMissingDataIndicator
            v-if="collections == undefined"
            icon="mdi-table-off"
            :title="t('catalogViewer.overview.collections.placeholder.unavailable')"
        />
        <VLoadingCircular v-else-if="loading && rows.length === 0" />
        <template v-else>
            <VDataTable
                v-model:expanded="expanded"
                :headers="headers"
                :items="rows"
                :loading="loading"
                item-value="entityType"
                density="compact"
                show-expand
                :items-per-page="-1"
                hide-default-footer
            >
                <!--
                    The header content is replaced to carry the column's explanation, so it has to redraw the sort
                    affordance the default header would have given it - the same one the entity grid draws.
                -->
                <template
                    v-for="header in headers"
                    :key="header.key"
                    v-slot:[`header.${header.key}`]="{ column, isSorted, getSortIcon }"
                >
                    <div class="collections-table__header">
                        <span class="collections-table__header-title">
                            {{ column.title }}
                            <VIcon icon="mdi-information-outline" size="x-small" />
                            <VTooltip activator="parent">
                                {{ headerDescriptions[header.key] }}
                            </VTooltip>
                        </span>
                        <VIcon v-if="isSorted(column)" size="small">{{ getSortIcon(column) }}</VIcon>
                        <VIcon v-else-if="column.sortable" size="small">mdi-sort</VIcon>
                    </div>
                </template>

                <template v-slot:[`item.entityType`]="{ item }">
                    <a class="collections-table__link" @click="openEntities(item.entityType)">
                        <VIcon size="x-small" class="mr-1">mdi-open-in-new</VIcon>
                        {{ item.entityType }}
                    </a>
                </template>
                <template v-slot:[`item.records`]="{ item }">
                    {{ recordsLabel(item) }}
                </template>
                <template v-slot:[`item.size`]="{ item }">
                    {{ formatBytes(item.snapshot.storageSize?.sizeOnDiskInBytes) }}
                </template>
                <template v-slot:[`item.indexes`]="{ item }">
                    {{ formatNumber(item.snapshot.indexSummary?.totalIndexCount) }}
                </template>
                <template v-slot:[`item.lastModified`]="{ item }">
                    <span v-if="item.snapshot.header?.lastModified != undefined">
                        {{ formatDateTime(item.snapshot.header.lastModified) }}
                    </span>
                    <span v-else class="text-disabled font-italic">
                        {{ t('catalogViewer.overview.collections.placeholder.lastModifiedUnknown') }}
                    </span>
                </template>

                <template #expanded-row="{ columns, item }">
                    <tr>
                        <td :colspan="columns.length" class="collections-table__detail">
                            <div class="collections-table__detail-grid">
                                <div>
                                    <div class="text-medium-emphasis mb-1">
                                        {{ t('catalogViewer.overview.collections.detail.storage') }}
                                    </div>
                                    <CollectionStorageBar
                                        v-if="item.snapshot.storageSize != undefined"
                                        :live-bytes="item.snapshot.storageSize.liveBytes"
                                        :waste-bytes="item.snapshot.storageSize.wasteBytes"
                                    />
                                    <span v-else class="text-disabled font-italic">
                                        {{ notApplicable() }}
                                    </span>
                                </div>

                                <div>
                                    <div class="text-medium-emphasis mb-1">
                                        {{ t('catalogViewer.overview.collections.detail.indexesByType') }}
                                    </div>
                                    <!-- the same breakdown the Indexes page draws for a selected collection -->
                                    <IndexSummaryTable
                                        v-if="hasIndexes(item)"
                                        :summary="item.snapshot.indexSummary!"
                                    />
                                    <span v-else class="text-disabled font-italic">
                                        {{ t('catalogViewer.overview.collections.placeholder.noIndexes') }}
                                    </span>
                                </div>
                            </div>

                            <div class="collections-table__detail-actions">
                                <VBtn
                                    size="small"
                                    prepend-icon="mdi-format-list-bulleted-type"
                                    @click="emit('openPage', CatalogViewerPage.Indexes, item.entityType)"
                                >
                                    {{ t('catalogViewer.overview.collections.detail.inspectIndexes') }}
                                </VBtn>
                                <VBtn
                                    size="small"
                                    prepend-icon="mdi-open-in-new"
                                    @click="openEntities(item.entityType)"
                                >
                                    {{ t('catalogViewer.overview.collections.detail.openInEntityViewer') }}
                                </VBtn>
                                <VBtn
                                    size="small"
                                    prepend-icon="mdi-file-code"
                                    @click="openSchema(item.entityType)"
                                >
                                    {{ t('catalogViewer.overview.collections.detail.openSchema') }}
                                </VBtn>
                            </div>
                        </td>
                    </tr>
                </template>
            </VDataTable>
        </template>
    </div>
</template>

<style lang="scss" scoped>
.collections-table {
    &__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
    }

    &__header-title {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
    }

    &__link {
        cursor: pointer;
        color: rgb(var(--v-theme-primary-lightest));
    }

    &__detail {
        padding: 1rem !important;
    }

    &__detail-grid {
        display: grid;
        grid-template-columns: minmax(16rem, 1fr) 2fr;
        gap: 1.5rem;
        align-items: start;
    }

    &__detail-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-top: 0.75rem;
    }
}
</style>
