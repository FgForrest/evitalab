<script setup lang="ts">
/**
 * Per-collection storage composition — what kind of data occupies each collection's space.
 *
 * One glance answers "this collection is 80 % associated data", which is what most storage questions actually
 * come down to. Bars share one scale across rows, so a row's length also states how big that collection is
 * relative to the largest one.
 *
 * The bars are plain CSS rather than ApexCharts on purpose: this is one bar *per row*, and a chart instance per
 * row of a catalog with dozens of collections is disproportionate to what a div can draw.
 *
 * **Rows are the server's own classification, not class names.** Every storage-part type declares which of the
 * fourteen groups it belongs to and which of the three kinds that group folds into, so the bar shows the kinds of
 * data the tab is described in and the breakdown opens one level further, into the groups a bucket summed — the
 * *Indexes* bucket in particular, whose split into attribute, price, reference and facet structures is the part a
 * schema owner can act on. See `service/storageComposition.ts`.
 */

import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { List as ImmutableList } from 'immutable'
import VLoadingCircular from '@/modules/base/component/VLoadingCircular.vue'
import VMissingDataIndicator from '@/modules/base/component/VMissingDataIndicator.vue'
import { CollectionInfo } from '@/modules/database-driver/request-response/statistics/CollectionInfo'
import { StoragePartUsage } from '@/modules/database-driver/request-response/statistics/StoragePartUsage'
import { catalogViewerComponents } from '@/modules/catalog-viewer/service/CatalogViewerService'
import { useCollectionSnapshots } from '@/modules/catalog-viewer/composable/useCollectionSnapshots'
import type {
    StorageBucketRow,
    StorageComposition,
    StorageGroupRow
} from '@/modules/catalog-viewer/model/storageComposition'
import {
    canonicalStorageBuckets,
    StorageBucket,
    storageBucketColor,
    storageBucketHelp,
    storageBucketLabel
} from '@/modules/catalog-viewer/model/storageComposition'
import { summarizeStorageComposition } from '@/modules/catalog-viewer/service/storageComposition'
import { formatBytes, formatNumber, formatPercent } from '@/modules/catalog-viewer/service/statisticsFormatting'

const { t } = useI18n()

const props = defineProps<{
    catalogName: string
    collections: ImmutableList<CollectionInfo> | undefined
    /**
     * The catalog's own data store — the schemas, the collection headers and the catalog-level indexes. It is
     * reported alongside the collections and gets a row of its own, the way it already does in the fragmentation
     * table.
     */
    catalogParts: ImmutableList<StoragePartUsage> | undefined
    reloadToken: number
}>()

/**
 * One data store of the page: a collection's, or the catalog's own.
 */
interface StoreRow {
    readonly key: string
    readonly label: string
    /**
     * The catalog's own store is not a collection — it is named rather than typed, and says so.
     */
    readonly ownStore: boolean
    readonly composition: StorageComposition
}

/**
 * The shared per-collection fan-out — the composition alone, see `storageCollectionRow`.
 */
const { snapshots, loading } = useCollectionSnapshots(
    () => props.catalogName,
    () => props.collections,
    catalogViewerComponents.storageCollectionRow,
    () => props.reloadToken,
    'catalogViewer.storage.composition.notification.couldNotLoad'
)

const collectionRows = computed<StoreRow[]>(() =>
    Array.from(snapshots.value, ([entityType, snapshot]): StoreRow => ({
        key: entityType,
        label: entityType,
        ownStore: false,
        composition: summarizeStorageComposition(
            snapshot.storageComposition?.parts ?? ImmutableList<StoragePartUsage>()
        )
    }))
)

const expandedStores = ref<Set<string>>(new Set())
const expandedBuckets = ref<Set<string>>(new Set())

const headers = computed(() => [
    { title: t('catalogViewer.storage.composition.column.type'), key: 'label' },
    { title: t('catalogViewer.storage.composition.column.records'), key: 'count', align: 'end' as const },
    { title: t('catalogViewer.storage.composition.column.bytes'), key: 'totalBytes', align: 'end' as const },
    { title: t('catalogViewer.storage.composition.column.averageSize'), key: 'averageBytes', align: 'end' as const },
    { title: t('catalogViewer.storage.composition.column.share'), key: 'share', align: 'end' as const }
])

const catalogStoreRow = computed<StoreRow | undefined>(() => {
    if (props.catalogParts == undefined) {
        return undefined
    }
    return {
        key: '__catalog__',
        label: t('catalogViewer.storage.composition.catalogStore'),
        ownStore: true,
        composition: summarizeStorageComposition(props.catalogParts)
    }
})

/**
 * The catalog's own store first because it is not a collection - it is the store the others sit in - and the
 * collections below it biggest first, so the question the section answers ("what is taking the space?") is
 * answered by the order as well as by the bars.
 */
const rows = computed<StoreRow[]>(() => {
    const collections: StoreRow[] = [...collectionRows.value]
        .sort((a: StoreRow, b: StoreRow) => Number(b.composition.totalBytes - a.composition.totalBytes))
    const catalogStore: StoreRow | undefined = catalogStoreRow.value
    return catalogStore == undefined ? collections : [catalogStore, ...collections]
})

/**
 * The legend states what the tab can show, so it lists the documented buckets whether or not this catalog holds
 * any of them; a bucket that only a newer server can produce joins it when one actually arrives.
 */
const legendBuckets = computed<StorageBucket[]>(() => {
    const present: Set<StorageBucket> = new Set()
    for (const row of rows.value) {
        for (const bucket of row.composition.buckets) {
            present.add(bucket.bucket)
        }
    }
    return [
        ...canonicalStorageBuckets,
        ...Array.from(present).filter(it => !canonicalStorageBuckets.includes(it))
    ]
})

/**
 * Denominator of the shared bar scale — the biggest data store on the page.
 */
const maxStoreBytes = computed<bigint>(() =>
    rows.value.reduce(
        (max: bigint, row: StoreRow) => row.composition.totalBytes > max ? row.composition.totalBytes : max,
        0n
    )
)

/**
 * Width of one segment as a share of the widest row, so segments of two rows are directly comparable.
 */
function segmentWidth(bucket: StorageBucketRow): string {
    if (maxStoreBytes.value === 0n) {
        return '0%'
    }
    return `${(Number(bucket.totalBytes) / Number(maxStoreBytes.value)) * 100}%`
}

function toggleStore(key: string): void {
    const next: Set<string> = new Set(expandedStores.value)
    if (next.has(key)) {
        next.delete(key)
    } else {
        next.add(key)
    }
    expandedStores.value = next
}

/**
 * A bucket opens only when it summed more than one group — the five entity-data buckets are one group each, and a
 * chevron that reveals a copy of the row it is on would be noise.
 */
function expandable(bucket: StorageBucketRow): boolean {
    return bucket.groups.length > 1
}

function bucketKey(store: StoreRow, bucket: StorageBucketRow): string {
    return `${store.key}::${bucket.bucket}`
}

function toggleBucket(store: StoreRow, bucket: StorageBucketRow): void {
    if (!expandable(bucket)) {
        return
    }
    const key: string = bucketKey(store, bucket)
    const next: Set<string> = new Set(expandedBuckets.value)
    if (next.has(key)) {
        next.delete(key)
    } else {
        next.add(key)
    }
    expandedBuckets.value = next
}

function partTypesOf(row: StorageBucketRow | StorageGroupRow): string {
    const partTypes: readonly string[] = 'groups' in row
        ? row.groups.flatMap((it: StorageGroupRow) => [...it.partTypes])
        : row.partTypes
    return t('catalogViewer.storage.composition.partTypes', { types: partTypes.join(', ') })
}

</script>

<template>
    <div class="storage-composition">
        <VMissingDataIndicator
            v-if="collections == undefined"
            icon="mdi-table-off"
            :title="t('catalogViewer.storage.composition.placeholder.unavailable')"
        />
        <template v-else>
            <div class="storage-composition__legend">
                <VChip
                    v-for="bucket in legendBuckets"
                    :key="bucket"
                    size="small"
                >
                    <span
                        class="storage-composition__swatch"
                        :style="{ backgroundColor: storageBucketColor(bucket) }"
                    />
                    {{ storageBucketLabel(bucket) }}
                    <VTooltip activator="parent">{{ storageBucketHelp(bucket) }}</VTooltip>
                </VChip>
            </div>

            <VLoadingCircular v-if="loading && collectionRows.length === 0" />

            <div
                v-for="row in rows"
                :key="row.key"
                class="storage-composition__row"
            >
                <div class="storage-composition__row-header" @click="toggleStore(row.key)">
                    <VIcon size="small">
                        {{ expandedStores.has(row.key) ? 'mdi-chevron-down' : 'mdi-chevron-right' }}
                    </VIcon>
                    <span
                        :class="[
                            'storage-composition__entity-type',
                            { 'text-medium-emphasis font-italic': row.ownStore }
                        ]"
                    >
                        {{ row.label }}
                        <VTooltip v-if="row.ownStore" activator="parent">
                            {{ t('catalogViewer.storage.composition.catalogStoreHelp') }}
                        </VTooltip>
                    </span>
                    <div class="storage-composition__bar">
                        <span
                            v-for="bucket in row.composition.buckets"
                            :key="bucket.bucket"
                            class="storage-composition__segment"
                            :style="{
                                width: segmentWidth(bucket),
                                backgroundColor: bucket.color
                            }"
                        >
                            <VTooltip activator="parent">
                                {{ bucket.label }}: {{ formatBytes(bucket.totalBytes) }}
                                ({{ formatPercent(bucket.share) }})
                            </VTooltip>
                        </span>
                    </div>
                    <span class="storage-composition__total">
                        {{ formatBytes(row.composition.totalBytes) }}
                        <VTooltip activator="parent">
                            {{ t('catalogViewer.storage.composition.totalHelp') }}
                        </VTooltip>
                    </span>
                </div>

                <!--
                    Sorting is left to the table's own uncontrolled state: every store sorts independently, and
                    the initial order is the biggest consumer first.
                -->
                <VDataTable
                    v-if="expandedStores.has(row.key)"
                    :headers="headers"
                    :items="row.composition.buckets"
                    :items-per-page="-1"
                    :sort-by="[{ key: 'totalBytes', order: 'desc' }]"
                    density="compact"
                    hide-default-footer
                    class="storage-composition__breakdown"
                >
                    <template
                        v-for="header in headers"
                        :key="header.key"
                        v-slot:[`header.${header.key}`]="{ column, isSorted, getSortIcon }"
                    >
                        <div class="storage-composition__header">
                            <span>{{ column.title }}</span>
                            <VIcon v-if="isSorted(column)" size="small">{{ getSortIcon(column) }}</VIcon>
                            <VIcon v-else size="small">mdi-sort</VIcon>
                        </div>
                    </template>

                    <!-- a bucket and the groups it summed are rendered as sibling rows: the group rows are the
                         same measurement one level finer, not a table of their own -->
                    <template #item="{ item }">
                        <tr>
                            <td>
                                <span
                                    :class="[
                                        'storage-composition__type',
                                        { 'storage-composition__type--expandable': expandable(item) }
                                    ]"
                                    @click="toggleBucket(row, item)"
                                >
                                    <VIcon v-if="expandable(item)" size="x-small">
                                        {{
                                            expandedBuckets.has(bucketKey(row, item))
                                                ? 'mdi-chevron-down'
                                                : 'mdi-chevron-right'
                                        }}
                                    </VIcon>
                                    <span v-else class="storage-composition__type-spacer" />
                                    <span
                                        class="storage-composition__swatch"
                                        :style="{ backgroundColor: item.color }"
                                    />
                                    {{ item.label }}
                                    <VIcon icon="mdi-information-outline" size="x-small" />
                                    <VTooltip activator="parent">
                                        <p>{{ item.help }}</p>
                                        <p class="storage-composition__part-types">{{ partTypesOf(item) }}</p>
                                    </VTooltip>
                                </span>
                            </td>
                            <td class="text-right">{{ formatNumber(item.count) }}</td>
                            <td class="text-right">{{ formatBytes(item.totalBytes) }}</td>
                            <td class="text-right">{{ formatBytes(item.averageBytes) }}</td>
                            <td class="text-right">{{ formatPercent(item.share) }}</td>
                        </tr>
                        <tr
                            v-for="group in (expandedBuckets.has(bucketKey(row, item)) ? item.groups : [])"
                            :key="group.key"
                            class="storage-composition__group-row"
                        >
                            <td>
                                <span class="storage-composition__group-type">
                                    {{ group.label }}
                                    <VIcon icon="mdi-information-outline" size="x-small" />
                                    <VTooltip activator="parent">
                                        <p v-if="group.help != undefined">{{ group.help }}</p>
                                        <p class="storage-composition__part-types">{{ partTypesOf(group) }}</p>
                                    </VTooltip>
                                </span>
                            </td>
                            <td class="text-right">{{ formatNumber(group.count) }}</td>
                            <td class="text-right">{{ formatBytes(group.totalBytes) }}</td>
                            <td class="text-right">{{ formatBytes(group.averageBytes) }}</td>
                            <td class="text-right">{{ formatPercent(group.share) }}</td>
                        </tr>
                    </template>

                    <template #no-data>
                        <span class="text-disabled font-italic">
                            {{ t('catalogViewer.storage.placeholder.nothingStored') }}
                        </span>
                    </template>
                </VDataTable>
            </div>
        </template>
    </div>
</template>

<style lang="scss" scoped>
.storage-composition {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    &__legend {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
    }

    &__swatch {
        display: inline-block;
        width: 0.75rem;
        height: 0.75rem;
        border-radius: 2px;
        margin-right: 0.375rem;
    }

    &__row {
        border-bottom: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
        padding-bottom: 0.25rem;
    }

    &__row-header {
        display: grid;
        grid-template-columns: 1.5rem minmax(8rem, 12rem) 1fr auto;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
        min-height: 2.25rem;
    }

    &__entity-type {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    &__bar {
        display: flex;
        height: 0.75rem;
        border-radius: 2px;
        overflow: hidden;
        background-color: rgb(var(--v-theme-primary-dark));
    }

    &__segment {
        height: 100%;
    }

    &__total {
        font-variant-numeric: tabular-nums;
        min-width: 6rem;
        text-align: right;
    }

    &__type {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;

        &--expandable {
            cursor: pointer;
        }
    }

    // keeps the label of a bucket that cannot be opened aligned with the ones that can
    &__type-spacer {
        display: inline-block;
        width: 1rem;
    }

    &__group-type {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        // the group rows sit under the bucket they were summed into, past its chevron and swatch
        margin-left: 2.25rem;
    }

    &__group-row {
        font-size: 0.8125rem;
    }

    // the engine's own names for the records the row summed, set apart from the explanation above them
    &__part-types {
        opacity: 0.7;
        margin-top: 0.375rem;
    }

    // the header slot replaces the default content, so it has to redraw the sort affordance itself - the same one
    // the collections table and the entity grid draw
    &__header {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
    }

    &__breakdown {
        // numbers are read down a column, so they line up on the digit rather than on the glyph width
        :deep(td) {
            font-variant-numeric: tabular-nums;
        }
    }
}
</style>
