<script setup lang="ts">
/**
 * Time travel: how far back the catalog can be read, what that costs on disk, and what is stopping superseded
 * files from going away.
 *
 * **Not empty when time travel is off.** Superseded data files awaiting deletion are reported in both modes, and
 * with time travel off a non-zero value is a genuine diagnostic rather than a leftover — so the version and
 * retention rows collapse into an explanatory note while the deletion-floor rows stay visible.
 */

import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { List as ImmutableList } from 'immutable'
import VPropertiesTable from '@/modules/base/component/VPropertiesTable.vue'
import VLoadingCircular from '@/modules/base/component/VLoadingCircular.vue'
import { Property } from '@/modules/base/model/properties-table/Property'
import { PropertyValue } from '@/modules/base/model/properties-table/PropertyValue'
import { OffsetDateTime } from '@/modules/database-driver/data-type/OffsetDateTime'
import {
    CatalogStatisticsComponent
} from '@/modules/database-driver/request-response/statistics/CatalogStatisticsComponent'
import { HistoryStatistics } from '@/modules/database-driver/request-response/statistics/HistoryStatistics'
import { catalogViewerComponents } from '@/modules/catalog-viewer/service/CatalogViewerService'
import { useCatalogSnapshot } from '@/modules/catalog-viewer/composable/useCatalogSnapshot'
import ComponentAvailabilityChips from '@/modules/catalog-viewer/component/ComponentAvailabilityChips.vue'
import UnavailableComponent from '@/modules/catalog-viewer/component/UnavailableComponent.vue'
import CatalogVersionsTable from '@/modules/catalog-viewer/component/history/CatalogVersionsTable.vue'
import { formatBytes, formatDateTime, formatNumber, notApplicable, share } from '@/modules/catalog-viewer/service/statisticsFormatting'

const { t } = useI18n()

const props = defineProps<{
    catalogName: string
    active: boolean
    reloadToken: number
}>()

const { snapshot, loading, reload } = useCatalogSnapshot(
    () => props.catalogName,
    catalogViewerComponents.history,
    () => props.active,
    () => props.reloadToken,
    { notificationKey: 'catalogViewer.history.notification.couldNotLoad' }
)

const shownComponents: readonly CatalogStatisticsComponent[] = ImmutableList(catalogViewerComponents.history)
    .filter(it => it !== CatalogStatisticsComponent.Identity)
    .toArray()

const history = computed<HistoryStatistics | undefined>(() => snapshot.value?.history)

const timeTravelEnabled = computed<boolean>(() => history.value?.timeTravelEnabled === true)

/**
 * A catalog version with the moment it was committed, as one plain value.
 *
 * The version is a measurement, not a keyword, so it is not a chip - and the timestamp belongs beside it (the
 * issue asks for the version "with its timestamp"), not behind the warning icon a `PropertyValue` note renders as.
 */
function versionWithTimestamp(version: bigint | undefined, timestamp: OffsetDateTime | undefined): string {
    if (version == undefined) {
        return notApplicable()
    }
    return timestamp == undefined
        ? formatNumber(version)
        : t('catalogViewer.history.coordinates.versionWithTimestamp', {
            version: formatNumber(version),
            timestamp: formatDateTime(timestamp)
        })
}

/**
 * Whether time travel is on is already stated by the chip next to the page title, so it is not repeated here.
 */
const coordinateProperties = computed<Property[]>(() => {
    const statistics: HistoryStatistics | undefined = history.value
    if (statistics == undefined) {
        return []
    }
    const properties: Property[] = []

    if (statistics.timeTravelEnabled) {
        properties.push(
            new Property(
                t('catalogViewer.history.coordinates.oldestAvailableVersion'),
                new PropertyValue(versionWithTimestamp(
                    statistics.knownOldestAvailableCatalogVersion,
                    statistics.oldestAvailableTimestamp
                )),
                t('catalogViewer.history.help.oldestAvailableVersion')
            ),
            new Property(
                t('catalogViewer.history.coordinates.newestVersion'),
                new PropertyValue(versionWithTimestamp(
                    statistics.knownNewestCatalogVersion,
                    statistics.newestTimestamp
                )),
                t('catalogViewer.history.help.newestVersion')
            ),
            new Property(
                t('catalogViewer.history.coordinates.retentionWindow'),
                new PropertyValue(
                    statistics.retentionWindowVersions != undefined
                        ? t('catalogViewer.history.coordinates.retentionWindowValue', {
                            versions: formatNumber(statistics.retentionWindowVersions)
                        })
                        : notApplicable()
                ),
                t('catalogViewer.history.help.retentionWindow')
            ),
            new Property(
                t('catalogViewer.history.coordinates.historySize'),
                new PropertyValue(formatBytes(statistics.walBytes)),
                t('catalogViewer.history.help.historySize')
            ),
            new Property(
                t('catalogViewer.history.coordinates.walFiles'),
                new PropertyValue(t('catalogViewer.history.coordinates.walFilesValue', {
                    files: formatNumber(statistics.walFileCount),
                    bytes: formatBytes(statistics.walBytes)
                })),
                t('catalogViewer.history.help.walFiles')
            ),
            new Property(
                t('catalogViewer.history.coordinates.oldestLogEntry'),
                new PropertyValue(formatDateTime(statistics.oldestAvailableTimestamp)),
                t('catalogViewer.history.help.oldestLogEntry')
            )
        )
    }

    properties.push(
        new Property(
            t('catalogViewer.history.coordinates.deletionFloor'),
            new PropertyValue(formatNumber(statistics.activeReaderFloor)),
            t('catalogViewer.history.help.deletionFloor')
        )
    )
    return properties
})

/**
 * The awaiting-deletion split, drawn on one shared scale so the two halves read against their total.
 */
interface AwaitingDeletionRow {
    readonly label: string
    readonly description: string
    readonly bytes: bigint
    readonly color: string | undefined
}

const awaitingDeletionRows = computed<AwaitingDeletionRow[]>(() => {
    const statistics: HistoryStatistics | undefined = history.value
    if (statistics == undefined) {
        return []
    }
    return [
        {
            label: t('catalogViewer.history.awaitingDeletion.blocked'),
            description: t('catalogViewer.history.help.blocked'),
            bytes: statistics.blockedByActiveReaderBytes,
            color: 'warning'
        },
        {
            label: t('catalogViewer.history.awaitingDeletion.purgeable'),
            description: t('catalogViewer.history.help.purgeable'),
            bytes: statistics.purgeableBytes,
            color: undefined
        }
    ]
})

function progressOf(row: AwaitingDeletionRow): number {
    const total: bigint | undefined = history.value?.awaitingDeletionBytes
    const value: number | undefined = total == undefined ? undefined : share(row.bytes, total)
    return value == undefined ? 0 : value * 100
}
</script>

<template>
    <div class="history-page">
        <VLoadingCircular v-if="loading && snapshot == undefined" />

        <template v-else-if="snapshot != undefined">
            <div class="history-page__header">
                <h3 class="history-page__title">{{ t('catalogViewer.history.title') }}</h3>
                <!--
                    the same state chip the overview header uses: filled, and coloured through `color` because
                    the global VChip default would win over `base-color`
                -->
                <VChip
                    size="small"
                    variant="flat"
                    :color="timeTravelEnabled ? 'success' : undefined"
                >
                    {{
                        timeTravelEnabled
                            ? t('catalogViewer.history.coordinates.enabled')
                            : t('catalogViewer.history.coordinates.disabled')
                    }}
                </VChip>
                <VSpacer />
                <ComponentAvailabilityChips
                    :components="shownComponents"
                    :statuses="(component) => snapshot?.statusOf(component)"
                />
            </div>

            <UnavailableComponent
                v-if="history == undefined"
                :status="snapshot.statusOf(CatalogStatisticsComponent.History)"
            />
            <template v-else>
                <VAlert v-if="!timeTravelEnabled" type="info" density="compact">
                    {{ t('catalogViewer.history.timeTravelOffNote') }}
                </VAlert>

                <VPropertiesTable :properties="coordinateProperties" />

                <section>
                    <h3 class="history-page__title">
                        {{ t('catalogViewer.history.awaitingDeletion.title') }}
                    </h3>
                    <p class="history-page__caption text-disabled">
                        {{
                            t('catalogViewer.history.awaitingDeletion.total', {
                                files: formatNumber(history.awaitingDeletionFileCount),
                                bytes: formatBytes(history.awaitingDeletionBytes)
                            })
                        }}
                    </p>
                    <div
                        v-for="row in awaitingDeletionRows"
                        :key="row.label"
                        class="history-page__deletion-row"
                    >
                        <span class="text-medium-emphasis">
                            {{ row.label }}
                            <VIcon icon="mdi-information-outline" size="x-small" />
                            <VTooltip activator="parent">{{ row.description }}</VTooltip>
                        </span>
                        <VProgressLinear
                            :model-value="progressOf(row)"
                            :color="row.color"
                            height="8"
                            rounded
                        />
                        <span class="history-page__deletion-value">{{ formatBytes(row.bytes) }}</span>
                    </div>
                </section>

                <!-- a finished restore has changed the catalog under this page, so its coordinates are re-read -->
                <CatalogVersionsTable
                    @restored="reload(true)"
                    :catalog-name="catalogName"
                    :oldest-available-version="history.knownOldestAvailableCatalogVersion"
                    :newest-version="history.knownNewestCatalogVersion"
                    :reload-token="reloadToken"
                />
            </template>
        </template>
    </div>
</template>

<style lang="scss" scoped>
.history-page {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;

    &__header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-wrap: wrap;
    }

    &__title {
        font-size: 1rem;
        font-weight: 500;
    }

    &__caption {
        font-size: 0.75rem;
        margin-bottom: 0.5rem;
    }

    &__deletion-row {
        display: grid;
        grid-template-columns: minmax(12rem, 18rem) 1fr auto;
        align-items: center;
        gap: 0.75rem;
        min-height: 2rem;
    }

    &__deletion-value {
        font-variant-numeric: tabular-nums;
        min-width: 6rem;
        text-align: right;
    }
}
</style>
