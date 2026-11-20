<script setup lang="ts">
/**
 * Stacked CSS bar splitting the query total into planning, execution, fetching and the root's unattributed time. The
 * label sits inside a segment of at least 12 %; every segment explains itself in a tooltip. Doubles as the legend of
 * the flamegraph colours.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { List } from 'immutable'
import { TelemetryPhaseShare } from '@/modules/console/result-visualiser/model/query-telemetry/TelemetryPhaseShare'
import { TelemetryPhaseGroup } from '@/modules/console/result-visualiser/model/query-telemetry/TelemetryPhaseGroup'
import { formatNanos, formatPercent } from '@/utils/statisticsFormatting'

const minimalLabelledShare: number = 0.12
const minimalVisibleShare: number = 0.004

const { t } = useI18n()

const props = defineProps<{
    shares: List<TelemetryPhaseShare>
}>()

const visibleShares = computed<TelemetryPhaseShare[]>(() => props.shares.filter(it => it.nanos > 0).toArray())

function phaseName(share: TelemetryPhaseShare): string {
    return t(`resultVisualizer.queryTelemetryVisualiser.phase.${share.group}`)
}
</script>

<template>
    <div class="phase-share-bar">
        <div
            v-for="share in visibleShares"
            :key="share.group"
            :class="['phase-share-bar__segment', { 'phase-share-bar__segment--self': share.group === TelemetryPhaseGroup.Root }]"
            :style="{
                flex: `${Math.max(share.share, minimalVisibleShare)} 1 0`,
                background: share.group === TelemetryPhaseGroup.Root ? undefined : `var(--telemetry-${share.group})`
            }"
        >
            <span v-if="share.share >= minimalLabelledShare">
                {{ phaseName(share) }} {{ formatPercent(share.share) }}
            </span>
            <VTooltip activator="parent">
                <strong>{{ phaseName(share) }}</strong>
                {{ formatNanos(share.nanos) }} · {{ formatPercent(share.share) }}
            </VTooltip>
        </div>
    </div>
</template>

<style lang="scss" scoped>
@use "./telemetry-colors" as *;

.phase-share-bar {
    display: flex;
    gap: 2px;
    height: 1.25rem;
    border-radius: 3px;
    overflow: hidden;

    &__segment {
        display: flex;
        align-items: center;
        min-width: 0;
        padding: 0 0.375rem;
        overflow: hidden;
        white-space: nowrap;
        font-size: 0.6875rem;
        font-weight: 500;
        color: var(--telemetry-ink-on-phase);

        span {
            overflow: hidden;
            text-overflow: ellipsis;
        }

        &--self {
            color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
            background: $telemetry-self-hatch-muted;
        }
    }
}
</style>
