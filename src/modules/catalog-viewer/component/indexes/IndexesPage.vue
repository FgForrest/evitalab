<script setup lang="ts">
/**
 * Index structure of the catalog, drilled down one owner at a time.
 *
 * The catalog sits beside the collections rather than above them, because it holds indexes of its own — reached
 * through the same calls with no entity type:
 *
 * ```
 * Catalog indexes  ─┐
 *                   ├─▶  Index type / scope  ──▶  Attribute index cardinality
 * Entity collection ┘
 * ```
 *
 * The owner selector is the only navigation the page has, and the selected chip is what states where the tables
 * below belong; nothing sits between it and them.
 *
 * `INDEX_CARDINALITY` means different things at the two levels: at catalog level it reports the global unique
 * indexes and is a handful of `O(1)` counter readings; at collection level it walks the collection's own indexes
 * and is the expensive one, so it is requested only for the collection the user selected.
 */

import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { asError } from '@/utils/error'
import { List as ImmutableList } from 'immutable'
import VLoadingCircular from '@/modules/base/component/VLoadingCircular.vue'
import type { Toaster } from '@/modules/notification/service/Toaster'
import { useToaster } from '@/modules/notification/service/Toaster'
import {
    CatalogStatisticsComponent
} from '@/modules/database-driver/request-response/statistics/CatalogStatisticsComponent'
import {
    EntityCollectionStatisticsSnapshot
} from '@/modules/database-driver/request-response/statistics/EntityCollectionStatisticsSnapshot'
import {
    catalogViewerComponents,
    CatalogViewerService,
    useCatalogViewerService
} from '@/modules/catalog-viewer/service/CatalogViewerService'
import { useCatalogSnapshot } from '@/modules/catalog-viewer/composable/useCatalogSnapshot'
import { useCollectionIndexCounts } from '@/modules/catalog-viewer/composable/useCollectionIndexCounts'
import ComponentAvailabilityChips from '@/modules/catalog-viewer/component/ComponentAvailabilityChips.vue'
import UnavailableComponent from '@/modules/catalog-viewer/component/UnavailableComponent.vue'
import CollectionSelector from '@/modules/catalog-viewer/component/indexes/CollectionSelector.vue'
import IndexSummaryTable from '@/modules/catalog-viewer/component/indexes/IndexSummaryTable.vue'
import IndexCardinalityTable from '@/modules/catalog-viewer/component/indexes/IndexCardinalityTable.vue'
import CatalogIndexesCard from '@/modules/catalog-viewer/component/indexes/CatalogIndexesCard.vue'
import { formatNumber } from '@/modules/catalog-viewer/service/statisticsFormatting'

const catalogViewerService: CatalogViewerService = useCatalogViewerService()
const toaster: Toaster = useToaster()
const { t } = useI18n()

const props = defineProps<{
    catalogName: string
    /**
     * Entity collection to describe on arrival, when the page was opened from a collection row. `undefined` starts
     * on the catalog's own indexes.
     */
    entityType?: string
    active: boolean
    reloadToken: number
}>()

const { snapshot, loading } = useCatalogSnapshot(
    () => props.catalogName,
    catalogViewerComponents.indexes,
    () => props.active,
    () => props.reloadToken,
    { notificationKey: 'catalogViewer.indexes.notification.couldNotLoad' }
)

/**
 * Selected owner: an entity type, or `undefined` for the catalog's own indexes.
 */
const selectedEntityType = ref<string | undefined>(props.entityType)
const collectionSnapshot = ref<EntityCollectionStatisticsSnapshot>()
const collectionLoading = ref<boolean>(false)

const shownComponents: readonly CatalogStatisticsComponent[] = ImmutableList(catalogViewerComponents.indexes)
    .filter(it => it !== CatalogStatisticsComponent.Identity)
    .toArray()

/**
 * Badge of the catalog chip: the global unique attribute indexes the catalog holds itself, which is exactly what
 * the table below the selector lists.
 */
const catalogIndexCount = computed<number | undefined>(() =>
    snapshot.value?.indexCardinality?.globalUniqueIndexes.size
)

/**
 * Badge of every collection chip, keyed by entity type.
 */
const collectionCounts = useCollectionIndexCounts(
    () => props.catalogName,
    () => snapshot.value?.collections,
    () => props.reloadToken,
    'catalogViewer.indexes.notification.couldNotLoadCounts'
)

/**
 * Loads the selected collection's index summary and cardinality. Nothing is fetched for the catalog owner — the
 * catalog-level snapshot already carries both.
 */
async function loadCollection(): Promise<void> {
    const entityType: string | undefined = selectedEntityType.value
    if (entityType == undefined) {
        collectionSnapshot.value = undefined
        return
    }
    collectionLoading.value = true
    try {
        collectionSnapshot.value = await catalogViewerService.getCollectionSnapshot(
            props.catalogName,
            entityType,
            catalogViewerComponents.indexesCollection
        )
    } catch (e) {
        collectionSnapshot.value = undefined
        await toaster.error(t('catalogViewer.indexes.notification.couldNotLoadCollection', { entityType }), asError(e))
    } finally {
        collectionLoading.value = false
    }
}

watch(
    [selectedEntityType, () => props.reloadToken],
    async () => await loadCollection(),
    { immediate: true }
)

// the page is mounted fresh every time it is displayed, but a second request from a collection row while it is
// already displayed must still move the selection
watch(() => props.entityType, entityType => {
    if (entityType != undefined) {
        selectedEntityType.value = entityType
    }
})
</script>

<template>
    <div class="indexes-page">
        <VLoadingCircular v-if="loading && snapshot == undefined" />

        <template v-else-if="snapshot != undefined">
            <ComponentAvailabilityChips
                :components="shownComponents"
                :statuses="(component) => snapshot?.statusOf(component)"
            />

            <div class="indexes-page__total text-medium-emphasis">
                {{
                    t('catalogViewer.indexes.totalIndexes', {
                        count: formatNumber(snapshot.indexSummary?.totalIndexCount)
                    })
                }}
            </div>

            <CollectionSelector
                v-model="selectedEntityType"
                :collections="snapshot.collections"
                :catalog-count="catalogIndexCount"
                :counts="collectionCounts"
            />

            <template v-if="selectedEntityType == undefined">
                <section>
                    <h3 class="indexes-page__section-title">
                        {{ t('catalogViewer.indexes.catalogIndexes.title') }}
                    </h3>
                    <UnavailableComponent
                        v-if="snapshot.indexCardinality == undefined"
                        :status="snapshot.statusOf(CatalogStatisticsComponent.IndexCardinality)"
                    />
                    <CatalogIndexesCard
                        v-else
                        :catalog-name="catalogName"
                        :indexes="snapshot.indexCardinality.globalUniqueIndexes"
                    />
                </section>
            </template>

            <template v-else>
                <VLoadingCircular v-if="collectionLoading" />
                <template v-else-if="collectionSnapshot != undefined">
                    <section>
                        <h3 class="indexes-page__section-title">
                            {{ t('catalogViewer.indexes.summary.title') }}
                        </h3>
                        <UnavailableComponent
                            v-if="collectionSnapshot.indexSummary == undefined"
                            :status="collectionSnapshot.statusOf(CatalogStatisticsComponent.IndexSummary)"
                        />
                        <IndexSummaryTable v-else :summary="collectionSnapshot.indexSummary" />
                    </section>

                    <section>
                        <h3 class="indexes-page__section-title">
                            {{ t('catalogViewer.indexes.cardinality.title') }}
                        </h3>
                        <p class="indexes-page__section-help text-disabled">
                            {{ t('catalogViewer.indexes.cardinality.help') }}
                        </p>
                        <UnavailableComponent
                            v-if="collectionSnapshot.indexCardinality == undefined"
                            :status="collectionSnapshot.statusOf(CatalogStatisticsComponent.IndexCardinality)"
                        />
                        <IndexCardinalityTable
                            v-else
                            :catalog-name="catalogName"
                            :entity-type="selectedEntityType"
                            :cardinality="collectionSnapshot.indexCardinality"
                        />
                    </section>
                </template>
            </template>
        </template>
    </div>
</template>

<style lang="scss" scoped>
.indexes-page {
    display: flex;
    flex-direction: column;
    gap: 1rem;

    &__total {
        font-size: 0.875rem;
    }

    &__section-title {
        font-size: 1rem;
        font-weight: 500;
        margin-bottom: 0.25rem;
    }

    &__section-help {
        font-size: 0.75rem;
        margin-bottom: 0.5rem;
    }
}
</style>
