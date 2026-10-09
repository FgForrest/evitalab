<script setup lang="ts">
/**
 * How much write work the catalog has done, and how fast it is doing it right now.
 *
 * Every figure is a counter read or an already-sampled rate — nothing here touches the file system — so this page
 * is safe to poll while it is displayed, and offers a pause button for when it is not wanted.
 *
 * The counters are **process-scoped**: they start at zero when the catalog is loaded and are not persisted, which
 * is why "counting since" is stated next to them rather than left for the reader to assume.
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
import { DurabilityStatistics } from '@/modules/database-driver/request-response/statistics/DurabilityStatistics'
import { OffsetDateTime } from '@/modules/database-driver/data-type/OffsetDateTime'
import { catalogViewerComponents } from '@/modules/catalog-viewer/service/CatalogViewerService'
import { useCatalogSnapshot } from '@/modules/catalog-viewer/composable/useCatalogSnapshot'
import ComponentAvailabilityChips from '@/modules/catalog-viewer/component/ComponentAvailabilityChips.vue'
import UnavailableComponent from '@/modules/catalog-viewer/component/UnavailableComponent.vue'
import StatTile from '@/modules/catalog-viewer/component/StatTile.vue'
import CommitPipelineDiagram from '@/modules/catalog-viewer/component/activity/CommitPipelineDiagram.vue'
import {
    formatBytes,
    formatDateTime,
    formatDuration,
    formatNumber,
    formatRate,
    formatSmallPercent,
    notApplicable,
    share
} from '@/modules/catalog-viewer/service/statisticsFormatting'

const { t } = useI18n()

const props = defineProps<{
    catalogName: string
    active: boolean
    reloadToken: number
}>()

const pollIntervalMillis: number = 5000

const { snapshot, loading, paused } = useCatalogSnapshot(
    () => props.catalogName,
    catalogViewerComponents.activity,
    () => props.active,
    () => props.reloadToken,
    { pollIntervalMillis, notificationKey: 'catalogViewer.activity.notification.couldNotLoad' }
)

const shownComponents: readonly CatalogStatisticsComponent[] = ImmutableList(catalogViewerComponents.activity)
    .filter(it => it !== CatalogStatisticsComponent.Identity)
    .toArray()

/**
 * One counter of the Activity row, already formatted for a `StatTile`.
 */
interface ActivityTile {
    readonly label: string
    readonly value: string
    readonly caption: string
    readonly description: string
}

/**
 * Conflicts read as a share of the transactions that reached a terminal state, because the bare count says nothing
 * without the write volume it was produced by. Undefined until at least one transaction has finished.
 */
const conflictShare = computed<number | undefined>(() => {
    const activity = snapshot.value?.activity
    if (activity == undefined) {
        return undefined
    }
    return share(
        activity.transactionsConflicted,
        activity.transactionsCommitted + activity.transactionsRolledBack + activity.transactionsConflicted
    )
})

/**
 * The counter row. The pipeline gaps are not part of it - they are watermark differences, not counters, and the
 * diagram below is where they read as the chain they are.
 */
const tiles = computed<ActivityTile[]>(() => {
    const activity = snapshot.value?.activity
    if (activity == undefined) {
        return []
    }
    return [
        {
            label: t('catalogViewer.activity.counter.transactionsCommitted'),
            value: formatNumber(activity.transactionsCommitted),
            caption: t('catalogViewer.activity.counter.perSecond', {
                rate: formatRate(activity.transactionsPerSecond)
            }),
            description: t('catalogViewer.activity.help.transactionsCommitted')
        },
        {
            label: t('catalogViewer.activity.counter.transactionsRolledBack'),
            value: formatNumber(activity.transactionsRolledBack),
            caption: '',
            description: t('catalogViewer.activity.help.transactionsRolledBack')
        },
        {
            label: t('catalogViewer.activity.counter.conflicts'),
            value: formatNumber(activity.transactionsConflicted),
            caption: conflictShare.value == undefined
                ? ''
                : t('catalogViewer.activity.counter.shareOfFinished', {
                    share: formatSmallPercent(conflictShare.value)
                }),
            description: t('catalogViewer.activity.help.conflicts')
        },
        {
            label: t('catalogViewer.activity.counter.mutationsApplied'),
            value: formatNumber(activity.mutationsApplied),
            caption: t('catalogViewer.activity.counter.perSecond', {
                rate: formatRate(activity.mutationsPerSecond)
            }),
            description: t('catalogViewer.activity.help.mutationsApplied')
        },
        {
            label: t('catalogViewer.activity.counter.walBytesWritten'),
            value: formatBytes(activity.walBytesAppended),
            caption: t('catalogViewer.activity.counter.perSecondBytes', {
                rate: formatBytes(Math.round(activity.walBytesPerSecond))
            }),
            description: t('catalogViewer.activity.help.walBytesWritten')
        }
    ]
})

const countingSince = computed<string>(() => {
    const since = snapshot.value?.activity?.countingSince
    return since == undefined
        ? notApplicable()
        : t('catalogViewer.activity.countingSince', { since: formatDateTime(since) })
})

const durability = computed<DurabilityStatistics | undefined>(() => snapshot.value?.durability)

/**
 * How long ago the last checkpoint finished. Every measured figure in the block describes that one checkpoint and only
 * changes when another happens, so on a write-idle catalog the numbers can be hours old — which the age says and the
 * timestamp alone does not.
 */
const checkpointAge = computed<string | undefined>(() => {
    const at: OffsetDateTime | undefined = durability.value?.lastCheckpointAt
    return at == undefined ? undefined : (at.toDateTime().toRelative() ?? undefined)
})

/**
 * The verdict on the last fence depth, or `undefined` when it is within the configured interval — the normal reading,
 * which is left undecorated.
 *
 * Fence depth is the only health signal in the block. Cadence cannot carry one: it cannot tell a catalog too busy to
 * checkpoint on time from one with nothing to checkpoint, and the second is by far the more common.
 */
const fenceVerdict = computed<KeywordValue | undefined>(() => {
    const statistics: DurabilityStatistics | undefined = durability.value
    if (statistics == undefined || !statistics.fenceOverdue) {
        return undefined
    }
    return statistics.fenceSeverelyOverdue
        ? new KeywordValue(
            t('catalogViewer.activity.durability.farAboveInterval'),
            'error',
            t('catalogViewer.activity.help.farAboveInterval')
        )
        : new KeywordValue(
            t('catalogViewer.activity.durability.aboveInterval'),
            'warning',
            t('catalogViewer.activity.help.aboveInterval')
        )
})

const durabilityProperties = computed<Property[]>(() => {
    const statistics: DurabilityStatistics | undefined = durability.value
    if (statistics == undefined) {
        return []
    }
    const checkpointInterval = new Property(
        t('catalogViewer.activity.durability.checkpointInterval'),
        new PropertyValue(formatDuration(statistics.checkpointIntervalMillis)),
        t('catalogViewer.activity.help.checkpointInterval')
    )
    if (!statistics.checkpointed) {
        // the configured interval is the only figure that means anything before the first checkpoint; the rest would
        // be a row of zeros describing a checkpoint that never happened
        return [checkpointInterval]
    }
    const fenceDepth: PropertyValue = new PropertyValue(formatDuration(statistics.lastFenceDepthMillis))
    return [
        checkpointInterval,
        new Property(
            t('catalogViewer.activity.durability.lastCadence'),
            new PropertyValue(formatDuration(statistics.lastCadenceMillis)),
            t('catalogViewer.activity.help.lastCadence')
        ),
        // the measured time is a plain value; only the verdict on it - within or above the configured interval - is
        // the low-cardinality keyword a chip is for, and it is attached here rather than to the cadence above
        new Property(
            t('catalogViewer.activity.durability.lastFenceDepth'),
            fenceVerdict.value == undefined
                ? fenceDepth
                : ImmutableList.of(fenceDepth, new PropertyValue(fenceVerdict.value)),
            t('catalogViewer.activity.help.lastFenceDepth')
        ),
        new Property(
            t('catalogViewer.activity.durability.filesForced'),
            new PropertyValue(t('catalogViewer.activity.durability.filesForcedValue', {
                files: formatNumber(statistics.lastFilesForced),
                duration: formatDuration(statistics.lastForceDurationMillis)
            })),
            t('catalogViewer.activity.help.filesForced')
        ),
        new Property(
            t('catalogViewer.activity.durability.checkpointsCompleted'),
            new PropertyValue(formatNumber(statistics.checkpointsCompleted)),
            t('catalogViewer.activity.help.checkpointsCompleted')
        ),
        new Property(
            t('catalogViewer.activity.durability.lastCheckpoint'),
            new PropertyValue(
                checkpointAge.value == undefined
                    ? formatDateTime(statistics.lastCheckpointAt)
                    : t('catalogViewer.activity.durability.lastCheckpointValue', {
                        when: formatDateTime(statistics.lastCheckpointAt),
                        age: checkpointAge.value
                    })
            ),
            t('catalogViewer.activity.help.lastCheckpoint')
        )
    ]
})
</script>

<template>
    <div class="activity-page">
        <div class="activity-page__live">
            <VIcon size="x-small" :color="paused ? undefined : 'success'">mdi-circle</VIcon>
            <span class="text-disabled">
                {{
                    paused
                        ? t('catalogViewer.activity.live.paused')
                        : t('catalogViewer.activity.live.running', { seconds: pollIntervalMillis / 1000 })
                }}
            </span>
            <VBtn icon variant="text" size="small" @click="paused = !paused">
                <VIcon>{{ paused ? 'mdi-play' : 'mdi-pause' }}</VIcon>
                <VTooltip activator="parent">
                    {{
                        paused
                            ? t('catalogViewer.activity.button.resume')
                            : t('catalogViewer.activity.button.pause')
                    }}
                </VTooltip>
            </VBtn>

            <VSpacer />

            <ComponentAvailabilityChips
                v-if="snapshot != undefined"
                :components="shownComponents"
                :statuses="(component) => snapshot?.statusOf(component)"
            />
        </div>

        <VLoadingCircular v-if="loading && snapshot == undefined" />

        <template v-else-if="snapshot != undefined">
            <UnavailableComponent
                v-if="snapshot.activity == undefined"
                :status="snapshot.statusOf(CatalogStatisticsComponent.Activity)"
            />
            <template v-else>
                <div class="activity-page__tiles">
                    <StatTile
                        v-for="tile in tiles"
                        :key="tile.label"
                        :label="tile.label"
                        :value="tile.value"
                        :caption="tile.caption || undefined"
                        :description="tile.description"
                    />
                </div>
                <p class="activity-page__caption text-disabled">{{ countingSince }}</p>
            </template>

            <section>
                <h3 class="activity-page__section-title">
                    {{ t('catalogViewer.activity.pipeline.title') }}
                </h3>
                <UnavailableComponent
                    v-if="snapshot.commitPipeline == undefined"
                    :status="snapshot.statusOf(CatalogStatisticsComponent.CommitPipeline)"
                />
                <CommitPipelineDiagram v-else :pipeline="snapshot.commitPipeline" />
            </section>

            <section>
                <h3 class="activity-page__section-title">
                    {{ t('catalogViewer.activity.durability.title') }}
                </h3>
                <UnavailableComponent
                    v-if="snapshot.durability == undefined"
                    :status="snapshot.statusOf(CatalogStatisticsComponent.Durability)"
                />
                <template v-else>
                    <VAlert
                        v-if="!snapshot.durability.checkpointed"
                        type="info"
                        density="compact"
                        class="activity-page__durability-note"
                    >
                        {{ t('catalogViewer.activity.durability.noCheckpointYet') }}
                    </VAlert>
                    <VPropertiesTable :properties="durabilityProperties" />
                    <p
                        v-if="snapshot.durability.checkpointed"
                        class="activity-page__caption activity-page__durability-caption text-disabled"
                    >
                        {{ t('catalogViewer.activity.durability.singleCheckpointNote') }}
                    </p>
                </template>
            </section>

            <p class="activity-page__caption text-disabled">
                {{ t('catalogViewer.activity.metricsNote') }}
            </p>
        </template>
    </div>
</template>

<style lang="scss" scoped>
.activity-page {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;

    &__live {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-wrap: wrap;
    }

    &__tiles {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
        gap: 1rem;
    }

    &__caption {
        font-size: 0.75rem;
    }

    &__durability-note {
        margin-bottom: 0.75rem;
    }

    &__durability-caption {
        margin-top: 0.5rem;
    }

    &__section-title {
        font-size: 1rem;
        font-weight: 500;
        margin-bottom: 0.5rem;
    }
}
</style>
