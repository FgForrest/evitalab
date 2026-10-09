<script setup lang="ts">
/**
 * Which indexes exist, and — only when asked — what each one costs in heap.
 *
 * This is a table with a per-row action rather than a treemap, and that is a consequence of the engine's design,
 * not a simplification: estimating an index's heap walks its contents and cannot be amortised (a measured warm
 * second pass came back *slower* than the cold one). Listing is cheap; measuring is about 4 µs for the median
 * index and 151 ms for the worst one on a production catalog. So the page pays only for the rows the user names —
 * which is stated on the *Measure* button itself rather than in a banner above the page.
 *
 * Two consequences the UI must state rather than hide:
 *
 * - **there is no collection total.** One exists only if the client measures every index and sums client-side, so
 *   the card beside the table sums the *measured rows only* and says so;
 * - **sorting by measured size is impossible** — it would mean measuring everything first, which is the one cost
 *   this design exists to avoid. The order select offers map order and the maintained counters, and carries the
 *   reason the fourth option is missing.
 *
 * Paging and page size are the data table's own: the rows come from one server page, so the table is a
 * `VDataTableServer` and its footer is the only paging control. The order select sits in that footer next to the
 * pages, because it selects the server ordering the paging is applied on top of — it is not a column sort, and the
 * columns are therefore not sortable.
 */

import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { asError } from '@/utils/error'
import { List as ImmutableList } from 'immutable'
import VLoadingCircular from '@/modules/base/component/VLoadingCircular.vue'
import type { Toaster } from '@/modules/notification/service/Toaster'
import { useToaster } from '@/modules/notification/service/Toaster'
import { EntityScope } from '@/modules/database-driver/request-response/schema/EntityScope'
import { OrderDirection } from '@/modules/database-driver/request-response/schema/OrderDirection'
import { EntityIndexType } from '@/modules/database-driver/request-response/statistics/EntityIndexType'
import { IndexBrowseOrdering } from '@/modules/database-driver/request-response/statistics/IndexBrowseOrdering'
import { IndexBrowseCriteria } from '@/modules/database-driver/request-response/statistics/IndexBrowseCriteria'
import { BrowsedIndex } from '@/modules/database-driver/request-response/statistics/BrowsedIndex'
import { BrowsedIndexPage } from '@/modules/database-driver/request-response/statistics/BrowsedIndexPage'
import { IndexDetail } from '@/modules/database-driver/request-response/statistics/IndexDetail'
import { catalogViewerComponents, CatalogViewerService, useCatalogViewerService } from '@/modules/catalog-viewer/service/CatalogViewerService'
import { useCatalogSnapshot } from '@/modules/catalog-viewer/composable/useCatalogSnapshot'
import { useCollectionIndexCounts } from '@/modules/catalog-viewer/composable/useCollectionIndexCounts'
import CollectionSelector from '@/modules/catalog-viewer/component/indexes/CollectionSelector.vue'
import StatTile from '@/modules/catalog-viewer/component/StatTile.vue'
import { formatBytes, formatDateTime, formatNumber, notApplicable } from '@/modules/catalog-viewer/service/statisticsFormatting'

const catalogViewerService: CatalogViewerService = useCatalogViewerService()
const toaster: Toaster = useToaster()
const { t } = useI18n()

const props = defineProps<{
    catalogName: string
    active: boolean
    reloadToken: number
}>()

/**
 * The catalog-level snapshot is requested only for the collection inventory the selector needs; nothing on this
 * page polls.
 */
const { snapshot } = useCatalogSnapshot(
    () => props.catalogName,
    catalogViewerComponents.indexes,
    () => props.active,
    () => props.reloadToken,
    { notificationKey: 'catalogViewer.memory.notification.couldNotLoad' }
)

/**
 * Badge of every collection chip: how many indexes browsing that collection will list.
 *
 * The catalog chip gets none. `INDEX_SUMMARY` reports the catalog-wide total, not how many indexes the catalog
 * holds itself, and the global unique attribute indexes the Indexes page badges the same chip with are a different
 * unit than the rows this page lists.
 */
const collectionCounts = useCollectionIndexCounts(
    () => props.catalogName,
    () => snapshot.value?.collections,
    () => props.reloadToken,
    'catalogViewer.memory.notification.couldNotLoadCounts'
)

const selectedEntityType = ref<string | undefined>(undefined)
const indexTypeFilter = ref<EntityIndexType[]>([])
const scopeFilter = ref<EntityScope[]>([])
const referenceFilter = ref<string | undefined>(undefined)
const referenceNames = ref<ImmutableList<string>>(ImmutableList())
const pageNumber = ref<number>(1)
const pageSize = ref<number>(20)

const page = ref<BrowsedIndexPage>()
const browsing = ref<boolean>(false)
/**
 * Measured rows of the *current page*, keyed by the index's identity pair. Cleared whenever the page changes —
 * a heap estimate belongs to the reading that produced it, not to a row number.
 */
const measured = ref<Map<string, IndexDetail>>(new Map())
const measuring = ref<Set<string>>(new Set())

const indexTypes: readonly EntityIndexType[] = [
    EntityIndexType.Global,
    EntityIndexType.ReferencedEntityType,
    EntityIndexType.ReferencedEntity,
    EntityIndexType.ReferencedGroupEntityType,
    EntityIndexType.ReferencedGroupEntity
]
const scopes: readonly EntityScope[] = [EntityScope.Live, EntityScope.Archive]
const pageSizes: readonly number[] = [20, 50, 100, 200]

/**
 * One entry of the order select. `ordering` is absent on the entry that only carries a `reason` — the option that
 * exists as a concept and cannot be offered.
 */
interface OrderingOption {
    readonly value: string
    readonly title: string
    readonly ordering?: IndexBrowseOrdering
    readonly direction?: OrderDirection
    readonly reason?: string
    readonly props?: Record<string, unknown>
}

/**
 * Orderings offered. Measured size is deliberately present as a disabled entry carrying the reason rather than
 * absent — see the component comment.
 */
const orderingOptions = computed<OrderingOption[]>(() => [
    {
        value: 'mapOrder',
        title: t('catalogViewer.memory.ordering.mapOrder'),
        ordering: IndexBrowseOrdering.MapOrder,
        direction: OrderDirection.Asc
    },
    {
        value: 'entityCountDesc',
        title: t('catalogViewer.memory.ordering.entityCountDesc'),
        ordering: IndexBrowseOrdering.EntityCount,
        direction: OrderDirection.Desc
    },
    {
        value: 'queryCountDesc',
        title: t('catalogViewer.memory.ordering.queryCountDesc'),
        ordering: IndexBrowseOrdering.QueryCount,
        direction: OrderDirection.Desc
    },
    {
        value: 'queryCountAsc',
        title: t('catalogViewer.memory.ordering.queryCountAsc'),
        ordering: IndexBrowseOrdering.QueryCount,
        direction: OrderDirection.Asc
    },
    {
        value: 'updateCountDesc',
        title: t('catalogViewer.memory.ordering.updateCountDesc'),
        ordering: IndexBrowseOrdering.UpdateCount,
        direction: OrderDirection.Desc
    },
    {
        value: 'measuredSize',
        title: t('catalogViewer.memory.ordering.measuredSize'),
        reason: t('catalogViewer.memory.ordering.measuredSizeReason'),
        props: { disabled: true }
    }
])

const selectedOrdering = ref<string>('mapOrder')

const ordering = computed<IndexBrowseOrdering>(() =>
    orderingOptions.value.find(it => it.value === selectedOrdering.value)?.ordering ?? IndexBrowseOrdering.MapOrder
)
const direction = computed<OrderDirection>(() =>
    orderingOptions.value.find(it => it.value === selectedOrdering.value)?.direction ?? OrderDirection.Asc
)

/**
 * Columns of the table. None of them sorts: the ordering is a server ordering picked in the footer, and a column
 * header offering a second, client-side order of one page would contradict it.
 */
const headers = computed(() => [
    { title: t('catalogViewer.memory.column.entityType'), key: 'entityType', sortable: false },
    { title: t('catalogViewer.memory.column.indexType'), key: 'indexType', sortable: false },
    { title: t('catalogViewer.memory.column.scope'), key: 'scope', sortable: false },
    { title: t('catalogViewer.memory.column.discriminator'), key: 'discriminator', sortable: false },
    { title: t('catalogViewer.memory.column.entities'), key: 'entityCount', align: 'end' as const, sortable: false },
    { title: t('catalogViewer.memory.column.usage'), key: 'usage', sortable: false },
    {
        title: t('catalogViewer.memory.column.estimatedSize'),
        key: 'estimatedSize',
        align: 'end' as const,
        sortable: false
    }
])

const rows = computed<BrowsedIndex[]>(() => page.value?.data.toArray() ?? [])

const measuredRows = computed<IndexDetail[]>(() => Array.from(measured.value.values()))
const measuredTotalBytes = computed<bigint>(() =>
    measuredRows.value.reduce((sum: bigint, it: IndexDetail) => sum + it.heapSizeInBytes, 0n)
)

function criteria(): IndexBrowseCriteria {
    return new IndexBrowseCriteria(
        props.catalogName,
        selectedEntityType.value,
        pageNumber.value,
        pageSize.value,
        ordering.value,
        direction.value,
        ImmutableList(indexTypeFilter.value),
        ImmutableList(scopeFilter.value),
        referenceFilter.value != undefined ? ImmutableList.of(referenceFilter.value) : ImmutableList()
    )
}

async function browse(): Promise<void> {
    browsing.value = true
    try {
        page.value = await catalogViewerService.browseIndexes(criteria())
        // a new page is a different set of indexes; keeping the old estimates would attribute them to other rows
        measured.value = new Map()
    } catch (e) {
        await toaster.error(t('catalogViewer.memory.notification.couldNotBrowse'), asError(e))
    } finally {
        browsing.value = false
    }
}

async function measure(index: BrowsedIndex): Promise<void> {
    const identity: string = index.identity
    measuring.value = new Set(measuring.value).add(identity)
    try {
        const detail: IndexDetail = await catalogViewerService.getIndexDetail(
            props.catalogName,
            index.entityType,
            index.indexPrimaryKey
        )
        const next: Map<string, IndexDetail> = new Map(measured.value)
        next.set(identity, detail)
        measured.value = next
    } catch (e) {
        await toaster.error(t('catalogViewer.memory.notification.couldNotMeasure'), asError(e))
    } finally {
        const next: Set<string> = new Set(measuring.value)
        next.delete(identity)
        measuring.value = next
    }
}

async function loadReferenceNames(): Promise<void> {
    referenceFilter.value = undefined
    if (selectedEntityType.value == undefined) {
        // a catalog index is bound to no reference at all, so the filter has nothing to offer there
        referenceNames.value = ImmutableList()
        return
    }
    try {
        referenceNames.value = await catalogViewerService.getReferenceNames(
            props.catalogName,
            selectedEntityType.value
        )
    } catch (e) {
        // the filter stays disabled, and the toast is what says why instead of a silently missing control
        referenceNames.value = ImmutableList()
        await toaster.error(t('catalogViewer.memory.notification.couldNotLoadReferences'), asError(e))
    }
}

function resetPaging(): void {
    pageNumber.value = 1
}

watch(selectedEntityType, async () => {
    resetPaging()
    await loadReferenceNames()
})

watch(selectedOrdering, () => resetPaging())

watch(
    [
        () => props.active,
        () => props.reloadToken,
        selectedEntityType,
        indexTypeFilter,
        scopeFilter,
        referenceFilter,
        ordering,
        direction,
        pageNumber,
        pageSize
    ],
    async () => {
        if (!props.active) {
            return
        }
        await browse()
    },
    { immediate: true, deep: true }
)

function heapLabel(index: BrowsedIndex): string {
    const detail: IndexDetail | undefined = measured.value.get(index.identity)
    return detail == undefined ? notApplicable() : formatNumber(detail.heapSizeInBytes)
}

function heapSecondaryLabel(index: BrowsedIndex): string | undefined {
    const detail: IndexDetail | undefined = measured.value.get(index.identity)
    return detail == undefined ? undefined : formatBytes(detail.heapSizeInBytes)
}

function usageLabel(index: BrowsedIndex): string {
    if (!index.measured) {
        return t('catalogViewer.memory.usage.notMeasured')
    }
    return t('catalogViewer.memory.usage.value', {
        queries: formatNumber(index.queryCount),
        updates: formatNumber(index.updateCount),
        since: index.observedSince != undefined
            ? formatDateTime(index.observedSince)
            : t('catalogViewer.memory.usage.unknownWindow')
    })
}
</script>

<template>
    <div class="memory-page">
        <CollectionSelector
            v-model="selectedEntityType"
            :collections="snapshot?.collections"
            :counts="collectionCounts"
        />

        <div class="memory-page__filters">
            <!-- both groups toggle a filter, so their chips carry the outline of an actionable chip -->
            <div class="memory-page__filter">
                <span class="memory-page__filter-label text-medium-emphasis">
                    {{ t('catalogViewer.memory.filter.indexType') }}
                </span>
                <VChipGroup v-model="indexTypeFilter" variant="outlined" multiple column>
                    <VChip
                        v-for="indexType in indexTypes"
                        :key="indexType"
                        :value="indexType"
                        label
                        size="small"
                        filter
                    >
                        {{ t(`catalogViewer.indexes.indexType.${indexType}`) }}
                    </VChip>
                </VChipGroup>
            </div>

            <div class="memory-page__filter">
                <span class="memory-page__filter-label text-medium-emphasis">
                    {{ t('catalogViewer.memory.filter.scope') }}
                </span>
                <VChipGroup v-model="scopeFilter" variant="outlined" multiple column>
                    <VChip
                        v-for="scope in scopes"
                        :key="scope"
                        :value="scope"
                        label
                        size="small"
                        filter
                    >
                        {{ t(`common.scope.${scope}`) }}
                    </VChip>
                </VChipGroup>
            </div>

            <!--
                the third filter of the same row, so it is labelled the same way - a floating label inside the
                field would put its name on a line of its own while the other two carry theirs above
            -->
            <div class="memory-page__filter memory-page__filter--fixed">
                <span class="memory-page__filter-label text-medium-emphasis">
                    {{ t('catalogViewer.memory.filter.reference') }}
                </span>
                <VSelect
                    v-model="referenceFilter"
                    :items="referenceNames.toArray()"
                    :placeholder="t('catalogViewer.memory.filter.anyReference')"
                    :disabled="referenceNames.isEmpty()"
                    density="compact"
                    clearable
                    hide-details
                    class="memory-page__select"
                />
            </div>
        </div>

        <VLoadingCircular v-if="browsing && page == undefined" />

        <div v-else-if="page != undefined" class="memory-page__body">
            <VDataTableServer
                v-model:page="pageNumber"
                v-model:items-per-page="pageSize"
                :headers="headers"
                :items="rows"
                :items-length="page.totalNumberOfRecords"
                :items-per-page-options="pageSizes"
                :loading="browsing"
                density="compact"
                class="memory-page__table"
            >
                <template #item="{ item: index }">
                    <tr>
                        <td>{{ index.entityType ?? t('catalogViewer.indexes.selector.catalogIndexes') }}</td>
                        <td>
                            {{
                                index.indexType != undefined
                                    ? t(`catalogViewer.indexes.indexType.${index.indexType}`)
                                    : notApplicable()
                            }}
                        </td>
                        <td>{{ t(`common.scope.${index.scope}`) }}</td>
                        <td>{{ index.discriminator ?? notApplicable() }}</td>
                        <td class="text-right">{{ formatNumber(index.entityCount) }}</td>
                        <td>{{ usageLabel(index) }}</td>
                        <!--
                            the action lives in the column it fills in: an unmeasured row shows the button where
                            its size would be, which is what says the figure is absent because nobody asked for it
                        -->
                        <td class="text-right">
                            <VBtn
                                v-if="!measured.has(index.identity)"
                                variant="outlined"
                                size="x-small"
                                :loading="measuring.has(index.identity)"
                                @click="measure(index)"
                            >
                                {{ t('catalogViewer.memory.button.measure') }}
                                <template #loader>
                                    <VProgressCircular indeterminate size="16" width="2" />
                                </template>
                                <VTooltip activator="parent">
                                    {{
                                        t('catalogViewer.memory.help.measure', {
                                            entities: formatNumber(index.entityCount)
                                        })
                                    }}
                                </VTooltip>
                            </VBtn>
                            <div v-else class="memory-page__size">
                                <div>
                                    <div>{{ heapLabel(index) }}</div>
                                    <div v-if="heapSecondaryLabel(index) != undefined" class="text-disabled">
                                        {{ heapSecondaryLabel(index) }}
                                    </div>
                                </div>
                                <VBtn
                                    icon
                                    variant="text"
                                    size="x-small"
                                    :loading="measuring.has(index.identity)"
                                    @click="measure(index)"
                                >
                                    <VIcon size="small">mdi-refresh</VIcon>
                                    <template #loader>
                                        <VProgressCircular indeterminate size="16" width="2" />
                                    </template>
                                    <VTooltip activator="parent">
                                        {{
                                            t('catalogViewer.memory.help.remeasure', {
                                                entities: formatNumber(index.entityCount)
                                            })
                                        }}
                                    </VTooltip>
                                </VBtn>
                            </div>
                        </td>
                    </tr>
                </template>

                <template #no-data>
                    <span class="text-disabled font-italic">
                        {{ t('catalogViewer.memory.placeholder.noIndexes') }}
                    </span>
                </template>

                <!--
                    the order select belongs to the paging, not to the columns: it picks the server ordering the
                    page is cut out of, so moving to another page keeps it
                -->
                <template v-slot:[`footer.prepend`]>
                    <div class="memory-page__footer-prepend">
                        <VSelect
                            v-model="selectedOrdering"
                            :items="orderingOptions"
                            :label="t('catalogViewer.memory.filter.ordering')"
                            density="compact"
                            variant="outlined"
                            hide-details
                            class="memory-page__ordering"
                        >
                            <!--
                                a disabled `VListItem` is `pointer-events: none`, so the reason cannot ride on a
                                tooltip of the unavailable option - it is rendered as its subtitle instead
                            -->
                            <template #item="{ props: itemProps, item }">
                                <VListItem v-bind="itemProps">
                                    <VListItemSubtitle
                                        v-if="item.raw.reason != undefined"
                                        class="memory-page__ordering-reason"
                                    >
                                        {{ item.raw.reason }}
                                    </VListItemSubtitle>
                                </VListItem>
                            </template>
                        </VSelect>
                        <span class="memory-page__catalog-version text-disabled">
                            {{
                                t('catalogViewer.memory.footer.catalogVersion', {
                                    catalogVersion: formatNumber(page.catalogVersion)
                                })
                            }}
                        </span>
                    </div>
                </template>
            </VDataTableServer>

            <StatTile
                :label="t('catalogViewer.memory.measuredOnPage.label')"
                :value="formatNumber(measuredTotalBytes)"
                :caption="t('catalogViewer.memory.measuredOnPage.caption', {
                    measured: formatNumber(measuredRows.length),
                    total: formatNumber(rows.length),
                    human: formatBytes(measuredTotalBytes)
                })"
                :description="t('catalogViewer.memory.measuredOnPage.help')"
                class="memory-page__measured"
            />
        </div>
    </div>
</template>

<style lang="scss" scoped>
.memory-page {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    align-items: start;

    // the captions of all filters sit on one line, and each control hangs under its own
    &__filters {
        display: flex;
        flex-wrap: wrap;
        align-items: start;
        gap: 0.75rem 1.5rem;
    }

    &__filter {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
    }

    // not shrinkable: next to two wrapping chip groups the select otherwise collapses to its minimum
    &__filter--fixed {
        flex: 0 0 auto;
    }

    &__filter-label {
        font-size: 0.75rem;
    }

    // a width, not a flex basis - the basis of a column flex item is its *height*
    &__select {
        width: 12rem;
    }

    // the table takes the width it can get, the measured card keeps its own next to it
    &__body {
        align-self: stretch;
        display: flex;
        flex-wrap: wrap;
        align-items: start;
        gap: 1rem;
    }

    &__table {
        flex: 1 1 32rem;
        min-width: 0;
    }

    &__measured {
        flex: 0 0 16rem;
    }

    &__footer-prepend {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex: 1 1 auto;
        min-width: 0;
    }

    &__ordering {
        max-width: 16rem;
        min-width: 10rem;
    }

    &__size {
        display: inline-flex;
        align-items: center;
        justify-content: flex-end;
        gap: 0.25rem;
    }

    &__ordering-reason {
        white-space: normal;
        max-width: 22rem;
        -webkit-line-clamp: unset;
    }

    &__catalog-version {
        font-size: 0.75rem;
    }
}
</style>
