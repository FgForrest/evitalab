<script setup lang="ts">
/**
 * "48 GB — but 48 GB of what?"
 *
 * Three classes of footprint with three different remedies: live data you inserted, reclaimable waste compaction
 * gives back, and retained history you shorten by changing write-ahead log retention. Costs targeted file stats
 * plus one directory listing, so it loads on activation and then only on an explicit reload — never on a poll.
 */

import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { List as ImmutableList } from 'immutable'
import VPropertiesTable from '@/modules/base/component/VPropertiesTable.vue'
import VLoadingCircular from '@/modules/base/component/VLoadingCircular.vue'
import { Property } from '@/modules/base/model/properties-table/Property'
import { PropertyValue } from '@/modules/base/model/properties-table/PropertyValue'
import { KeywordValue } from '@/modules/base/model/properties-table/KeywordValue'
import {
    CatalogStatisticsComponent
} from '@/modules/database-driver/request-response/statistics/CatalogStatisticsComponent'
import { StorageSizeStatistics } from '@/modules/database-driver/request-response/statistics/StorageSizeStatistics'
import { catalogViewerComponents } from '@/modules/catalog-viewer/service/CatalogViewerService'
import { useCatalogSnapshot } from '@/modules/catalog-viewer/composable/useCatalogSnapshot'
import { StorageBreakdownRow } from '@/modules/catalog-viewer/model/StorageBreakdownRow'
import ComponentAvailabilityChips from '@/modules/catalog-viewer/component/ComponentAvailabilityChips.vue'
import UnavailableComponent from '@/modules/catalog-viewer/component/UnavailableComponent.vue'
import StorageBreakdownBar from '@/modules/catalog-viewer/component/storage/StorageBreakdownBar.vue'
import StorageBreakdownLegend from '@/modules/catalog-viewer/component/storage/StorageBreakdownLegend.vue'
import ActiveRecordShareGauge from '@/modules/catalog-viewer/component/storage/ActiveRecordShareGauge.vue'
import StorageCompositionTable from '@/modules/catalog-viewer/component/storage/StorageCompositionTable.vue'
import {
    formatBytes,
    formatDateTime,
    formatDuration,
    formatNumber,
    notApplicable
} from '@/modules/catalog-viewer/service/statisticsFormatting'

const { t } = useI18n()

const props = defineProps<{
    catalogName: string
    active: boolean
    reloadToken: number
}>()

const { snapshot, loading } = useCatalogSnapshot(
    () => props.catalogName,
    catalogViewerComponents.storage,
    () => props.active,
    () => props.reloadToken,
    { notificationKey: 'catalogViewer.storage.notification.couldNotLoad' }
)

const shownComponents: readonly CatalogStatisticsComponent[] = ImmutableList(catalogViewerComponents.storage)
    .filter(it => it !== CatalogStatisticsComponent.Identity)
    .toArray()

const storageSize = computed<StorageSizeStatistics | undefined>(() => snapshot.value?.storageSize)

/**
 * Top-level categories only — the engine's measured total is their sum by construction.
 */
const topLevelRows = computed<ImmutableList<StorageBreakdownRow>>(() => {
    const size: StorageSizeStatistics | undefined = storageSize.value
    if (size == undefined) {
        return ImmutableList()
    }
    return ImmutableList.of(
        new StorageBreakdownRow(
            t('catalogViewer.storage.label.liveData'),
            t('catalogViewer.storage.help.liveData'),
            size.liveBytes,
            '#21BFE3'
        ),
        new StorageBreakdownRow(
            t('catalogViewer.storage.label.reclaimableWaste'),
            t('catalogViewer.storage.help.reclaimableWaste'),
            size.wasteBytes,
            '#f7a729'
        ),
        new StorageBreakdownRow(
            t('catalogViewer.storage.label.writeAheadLog'),
            t('catalogViewer.storage.help.writeAheadLog'),
            size.walBytes,
            '#487ad3'
        ),
        new StorageBreakdownRow(
            t('catalogViewer.storage.label.awaitingDeletion'),
            t('catalogViewer.storage.help.awaitingDeletion'),
            size.awaitingDeletionBytes,
            '#8e6fd8'
        ),
        new StorageBreakdownRow(
            t('catalogViewer.storage.label.versionIndex'),
            t('catalogViewer.storage.help.versionIndex'),
            size.bootstrapBytes,
            '#A5ACBC'
        ),
        new StorageBreakdownRow(
            t('catalogViewer.storage.label.unaccounted'),
            t('catalogViewer.storage.help.unaccounted'),
            size.unaccountedBytes,
            '#E13321'
        )
    )
})

/**
 * The legend adds the nested split of what is awaiting deletion — the footprint developers most often cannot
 * explain, and the one whose two halves have different remedies.
 */
const legendRows = computed<ImmutableList<StorageBreakdownRow>>(() => {
    const size: StorageSizeStatistics | undefined = storageSize.value
    if (size == undefined) {
        return ImmutableList()
    }
    const rows: StorageBreakdownRow[] = topLevelRows.value.toArray()
    const awaitingDeletionIndex: number = rows.findIndex(
        it => it.label === t('catalogViewer.storage.label.awaitingDeletion')
    )
    rows.splice(
        awaitingDeletionIndex + 1,
        0,
        new StorageBreakdownRow(
            t('catalogViewer.storage.label.blockedByActiveReader'),
            t('catalogViewer.storage.help.blockedByActiveReader'),
            size.blockedByActiveReaderBytes,
            undefined,
            1
        ),
        new StorageBreakdownRow(
            t('catalogViewer.storage.label.purgeable'),
            t('catalogViewer.storage.help.purgeable'),
            size.purgeableBytes,
            undefined,
            1
        )
    )
    return ImmutableList(rows)
})

const fragmentationProperties = computed<Property[]>(() => {
    const fragmentation = snapshot.value?.fragmentation
    const header = snapshot.value?.collections
    return [
        new Property(
            t('catalogViewer.storage.fragmentation.wasteAccumulationRate'),
            new PropertyValue(
                fragmentation == undefined
                    ? notApplicable()
                    : t('catalogViewer.storage.fragmentation.wasteAccumulationRateValue', {
                        rate: formatBytes(Math.round(fragmentation.wasteAccumulationRateBytesPerSecond))
                    })
            ),
            t('catalogViewer.storage.help.wasteAccumulationRate')
        ),
        new Property(
            t('catalogViewer.storage.fragmentation.wasteBytesGenerated'),
            new PropertyValue(formatBytes(fragmentation?.wasteBytesGenerated)),
            t('catalogViewer.storage.help.wasteBytesGenerated')
        ),
        new Property(
            t('catalogViewer.storage.fragmentation.estimatedCompaction'),
            new PropertyValue(
                fragmentation?.compactionEligibleNow === true
                    ? new KeywordValue(t('catalogViewer.storage.fragmentation.eligibleNow'), 'warning')
                    : fragmentation?.estimatedCompactionAt != undefined
                        ? formatDateTime(fragmentation.estimatedCompactionAt)
                        : t('catalogViewer.storage.fragmentation.noCrossingProjected')
            ),
            t('catalogViewer.storage.help.estimatedCompaction')
        ),
        new Property(
            t('catalogViewer.storage.fragmentation.fileSizeThreshold'),
            new PropertyValue(formatBytes(fragmentation?.fileSizeCompactionThresholdBytes)),
            t('catalogViewer.storage.help.fileSizeThreshold')
        ),
        new Property(
            t('catalogViewer.storage.fragmentation.minCompactionInterval'),
            new PropertyValue(formatDuration(fragmentation?.minCompactionIntervalMilliseconds)),
            t('catalogViewer.storage.help.minCompactionInterval')
        ),
        new Property(
            t('catalogViewer.storage.fragmentation.catalogDataStore'),
            new PropertyValue(
                fragmentation?.catalogDataStore == undefined
                    ? notApplicable()
                    : t('catalogViewer.storage.fragmentation.catalogDataStoreValue', {
                        live: formatBytes(fragmentation.catalogDataStore.liveBytes),
                        waste: formatBytes(fragmentation.catalogDataStore.wasteBytes)
                    }),
                fragmentation?.catalogDataStore?.compactionEligibleNow === true
                    ? t('catalogViewer.storage.fragmentation.catalogDataStoreEligible')
                    : undefined
            ),
            t('catalogViewer.storage.help.catalogDataStore')
        ),
        new Property(
            t('catalogViewer.storage.fragmentation.collectionsCount'),
            new PropertyValue(formatNumber(header?.size)),
            t('catalogViewer.storage.help.collectionsCount')
        )
    ]
})

const volatileProperties = computed<Property[]>(() => {
    const volatileState = snapshot.value?.volatileState
    return [
        new Property(
            t('catalogViewer.storage.volatile.pendingFlush'),
            new PropertyValue(
                volatileState == undefined
                    ? notApplicable()
                    : t('catalogViewer.storage.volatile.pendingFlushValue', {
                        records: formatNumber(volatileState.nonFlushedRecordCount),
                        bytes: formatBytes(volatileState.nonFlushedSizeBytes)
                    })
            ),
            t('catalogViewer.storage.help.pendingFlush')
        ),
        new Property(
            t('catalogViewer.storage.volatile.retainedInMemory'),
            new PropertyValue(formatBytes(volatileState?.totalSizeIncludingVolatileDataBytes)),
            t('catalogViewer.storage.help.retainedInMemory')
        ),
        new Property(
            t('catalogViewer.storage.volatile.oldestRetainedVersion'),
            new PropertyValue(
                volatileState?.oldestRecordKeptTimestamp != undefined
                    ? formatDateTime(volatileState.oldestRecordKeptTimestamp)
                    : t('catalogViewer.storage.volatile.nothingRetained')
            ),
            t('catalogViewer.storage.help.oldestRetainedVersion')
        )
    ]
})

const compactionEligible = computed<boolean | undefined>(() => snapshot.value?.fragmentation?.compactionEligibleNow)
</script>

<template>
    <div class="storage-page">
        <VLoadingCircular v-if="loading && snapshot == undefined" />

        <template v-else-if="snapshot != undefined">
            <ComponentAvailabilityChips
                :components="shownComponents"
                :statuses="(component) => snapshot?.statusOf(component)"
            />

            <section>
                <h3 class="storage-page__section-title">
                    {{ t('catalogViewer.storage.total.title') }}
                    <span class="storage-page__section-help-icon">
                        <VIcon icon="mdi-information-outline" size="x-small" />
                        <VTooltip activator="parent">
                            <span>{{ t('catalogViewer.storage.help.total') }}</span>
                        </VTooltip>
                    </span>
                </h3>
                <UnavailableComponent
                    v-if="storageSize == undefined"
                    :status="snapshot.statusOf(CatalogStatisticsComponent.StorageSize)"
                />
                <template v-else>
                    <div class="storage-page__total">
                        {{ formatBytes(storageSize.sizeOnDiskInBytes) }}
                    </div>
                    <StorageBreakdownBar
                        :rows="topLevelRows"
                        :total-bytes="storageSize.sizeOnDiskInBytes"
                    />
                    <StorageBreakdownLegend
                        :rows="legendRows"
                        :total-bytes="storageSize.sizeOnDiskInBytes"
                    />
                </template>
            </section>

            <section>
                <h3 class="storage-page__section-title">
                    {{ t('catalogViewer.storage.fragmentation.title') }}
                </h3>
                <UnavailableComponent
                    v-if="snapshot.fragmentation == undefined"
                    :status="snapshot.statusOf(CatalogStatisticsComponent.Fragmentation)"
                />
                <div v-else class="storage-page__fragmentation">
                    <ActiveRecordShareGauge
                        :active-record-share="snapshot.fragmentation.activeRecordShare"
                        :minimal-active-record-share="snapshot.fragmentation.minimalActiveRecordShare"
                        :max-waste-active-share="snapshot.fragmentation.maxWasteActiveShare"
                    >
                        <!-- the verdict is the page's, taken from `compactionEligibleNow` and never from the
                             share the gauge draws; the gauge only places it under its legend -->
                        <template #verdict>
                            <VChip
                                :color="compactionEligible ? 'warning' : 'success'"
                                :base-color="compactionEligible ? 'warning' : 'success'"
                                :prepend-icon="compactionEligible ? 'mdi-alert-outline' : 'mdi-check-circle'"
                                size="small"
                            >
                                {{
                                    compactionEligible
                                        ? t('catalogViewer.storage.fragmentation.verdict.eligible')
                                        : t('catalogViewer.storage.fragmentation.verdict.notDue')
                                }}
                                <VTooltip activator="parent">
                                    {{ t('catalogViewer.storage.help.compactionVerdict') }}
                                </VTooltip>
                            </VChip>
                        </template>
                    </ActiveRecordShareGauge>
                    <VPropertiesTable :properties="fragmentationProperties" />
                </div>
            </section>

            <section>
                <h3 class="storage-page__section-title">
                    {{ t('catalogViewer.storage.composition.title') }}
                </h3>
                <p class="storage-page__section-help text-disabled">
                    {{ t('catalogViewer.storage.composition.help') }}
                </p>
                <StorageCompositionTable
                    :catalog-name="catalogName"
                    :collections="snapshot.collections"
                    :catalog-parts="snapshot.storageComposition?.catalogParts"
                    :reload-token="reloadToken"
                />
            </section>

            <VExpansionPanels>
                <VExpansionPanel :title="t('catalogViewer.storage.volatile.title')">
                    <template #text>
                        <UnavailableComponent
                            v-if="snapshot.volatileState == undefined"
                            :status="snapshot.statusOf(CatalogStatisticsComponent.VolatileState)"
                        />
                        <VPropertiesTable v-else :properties="volatileProperties" />
                    </template>
                </VExpansionPanel>
            </VExpansionPanels>
        </template>
    </div>
</template>

<style lang="scss" scoped>
.storage-page {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;

    &__section-title {
        font-size: 1rem;
        font-weight: 500;
        margin-bottom: 0.25rem;
    }

    &__section-help-icon {
        display: inline-flex;
        vertical-align: middle;
    }

    &__section-help {
        font-size: 0.75rem;
        margin-bottom: 0.5rem;
    }

    &__total {
        font-size: 2rem;
        font-weight: 500;
        line-height: 1.2;
        margin-bottom: 0.5rem;
    }

    &__fragmentation {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(22rem, 1fr));
        gap: 1.5rem;
        align-items: start;
    }
}
</style>
