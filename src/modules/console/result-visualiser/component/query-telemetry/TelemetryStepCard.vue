<script setup lang="ts">
/**
 * Card of one step in the Steps tab, one row each: short phase label with the plan button, first argument (with the
 * estimated `cost` of a candidate plan), `spent · self · share` and the chips of the step (alternative verdict, prefetch, sort resolution); the full operation
 * name and all arguments are in the tooltip. Only the label and the argument are ellipsised. The background is the phase hue at an intensity growing with the
 * step's share of the tab's root step (`0.12 + 0.78·√share`), the phase group sits on a 4 px stripe. The card is
 * read-only; its only action is the plan button.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type {
    VisualisedTelemetryStep
} from '@/modules/console/result-visualiser/model/query-telemetry/VisualisedTelemetryStep'
import { QueryPhase } from '@/modules/database-driver/request-response/data/QueryPhase'
import { telemetryStepLabel } from '@/modules/console/result-visualiser/service/query-telemetry/telemetryStepLabel'
import { formatNanos, formatNumber, formatPercent } from '@/utils/statisticsFormatting'
import VActionTooltip from '@/modules/base/component/VActionTooltip.vue'

/**
 * Fill alpha above which the card switches to dark ink.
 */
const darkInkThreshold: number = 0.55

const { t } = useI18n()

const props = defineProps<{
    step: VisualisedTelemetryStep,
    /**
     * Root step of the tab; shares and the fill intensity are relative to it.
     */
    root: VisualisedTelemetryStep,
    /**
     * Id of the telemetry root, to tell the executed plan from a candidate one.
     */
    telemetryRootId: string
}>()
const emit = defineEmits<{
    (e: 'openPlan', stepId: string): void
}>()

const shareOfRoot = computed<number>(() => props.root.spent === 0 ? 0 : props.step.spent / props.root.spent)
const fillAlpha = computed<number>(() => 0.12 + 0.78 * Math.sqrt(Math.min(1, shareOfRoot.value)))
const darkInk = computed<boolean>(() => fillAlpha.value > darkInkThreshold)

const cardStyle = computed<Record<string, string>>(() => ({
    background: `rgba(var(--telemetry-${props.step.group}-rgb), ${fillAlpha.value.toFixed(2)})`,
    borderLeftColor: `var(--telemetry-${props.step.group})`
}))

const isAlternative = computed<boolean>(() => props.step.operation === QueryPhase.PlanningFilterAlternative)
const prefetched = computed<boolean>(() => props.step.metrics?.prefetched === true)
const sortResolutionArgument = computed<string | undefined>(() =>
    props.step.sortResolution == undefined
        ? undefined
        : props.step.arguments.find(it => it.startsWith('sortResolution'))
)

const planButtonTooltip = computed<string>(() => {
    if (props.step.alternative?.winner === true) {
        return t('resultVisualizer.queryTelemetryVisualiser.button.showWinnerPlan')
    }
    return props.step.planStepId === props.telemetryRootId
        ? t('resultVisualizer.queryTelemetryVisualiser.button.showExecutedPlan')
        : t('resultVisualizer.queryTelemetryVisualiser.button.showCandidatePlan')
})

function openPlan(): void {
    if (props.step.planStepId != undefined) {
        emit('openPlan', props.step.planStepId)
    }
}
</script>

<template>
    <div
        :class="[
            'telemetry-step-card',
            {
                'telemetry-step-card--dark-ink': darkInk,
                'telemetry-step-card--dimmed': step.alternative?.outranked === true
            }
        ]"
        :style="cardStyle"
    >
        <div class="telemetry-step-card__header">
            <span class="telemetry-step-card__phase">
                {{ telemetryStepLabel(step) }}
            </span>
            <VBtn
                v-if="step.planStepId != undefined"
                icon
                variant="text"
                density="compact"
                size="x-small"
                class="telemetry-step-card__plan"
                @click.stop="openPlan"
            >
                <VIcon size="small">mdi-file-tree-outline</VIcon>
                <VActionTooltip>{{ planButtonTooltip }}</VActionTooltip>
            </VBtn>
            <span v-else-if="step.alternative?.planNotRecorded === true" class="telemetry-step-card__plan-disabled">
                <VBtn icon variant="text" density="compact" size="x-small" disabled class="telemetry-step-card__plan">
                    <VIcon size="small">mdi-file-tree-outline</VIcon>
                </VBtn>
                <VTooltip activator="parent">
                    {{ t('resultVisualizer.queryTelemetryVisualiser.button.planNotRecorded') }}
                </VTooltip>
            </span>
        </div>

        <!-- the details tooltip (all arguments in full) is anchored here, away from the button and the chips -->
        <div class="telemetry-step-card__body">
            <div class="telemetry-step-card__argument-row">
                <span class="telemetry-step-card__argument">{{ step.conciseArgument ?? '' }}</span>
                <span v-if="isAlternative && step.plan != undefined" class="telemetry-step-card__cost">
                    {{ t('resultVisualizer.queryTelemetryVisualiser.label.cost', { cost: formatNumber(step.plan.estimatedCost) }) }}
                </span>
            </div>
            <div class="telemetry-step-card__numbers">
                <strong>{{ formatNanos(step.spent) }}</strong>
                <span>{{ t('resultVisualizer.queryTelemetryVisualiser.label.selfShort', { duration: formatNanos(step.self) }) }}</span>
                <span>{{ formatPercent(shareOfRoot) }}</span>
            </div>
            <VTooltip activator="parent">
                <div class="telemetry-step-card__tooltip">
                    <strong>{{ step.operation }}</strong>
                    <span class="text-medium-emphasis">{{ t('resultVisualizer.queryTelemetryVisualiser.label.spent') }}</span>
                    <span>{{ formatNanos(step.spent) }}</span>
                    <span class="text-medium-emphasis">{{ t('resultVisualizer.queryTelemetryVisualiser.label.self') }}</span>
                    <span>{{ formatNanos(step.self) }}</span>
                    <span class="text-medium-emphasis">{{ t('resultVisualizer.queryTelemetryVisualiser.label.ofRoot', { title: telemetryStepLabel(root) }) }}</span>
                    <span>{{ formatPercent(shareOfRoot) }}</span>
                    <span class="text-medium-emphasis">{{ t('resultVisualizer.queryTelemetryVisualiser.label.ofTotal') }}</span>
                    <span>{{ formatPercent(step.shareOfTotal) }}</span>
                    <span class="text-medium-emphasis">{{ t('resultVisualizer.queryTelemetryVisualiser.label.startOffset') }}</span>
                    <span>{{ formatNanos(step.start) }}</span>
                    <code
                        v-for="(argument, index) in step.arguments"
                        :key="index"
                        class="telemetry-step-card__full-argument"
                    >{{ argument }}</code>
                </div>
            </VTooltip>
        </div>

        <div class="telemetry-step-card__chips">
            <VChip v-if="step.alternative?.winner === true" size="x-small" variant="flat" color="success">
                {{ t('resultVisualizer.queryTelemetryVisualiser.chip.winner') }}
            </VChip>
            <VChip v-if="step.alternative != undefined && !step.alternative.eligible" size="x-small">
                {{
                    step.alternative.ineligibleReason != undefined
                        ? t('resultVisualizer.queryTelemetryVisualiser.chip.notEligibleWithReason', { reason: step.alternative.ineligibleReason })
                        : t('resultVisualizer.queryTelemetryVisualiser.chip.notEligible')
                }}
                <VTooltip activator="parent">
                    {{ t('resultVisualizer.queryTelemetryVisualiser.help.notEligible', { argument: step.firstArgument ?? '' }) }}
                </VTooltip>
            </VChip>
            <VChip v-if="step.alternative?.hashUnknown === true" size="x-small">
                {{ t('resultVisualizer.queryTelemetryVisualiser.chip.hashMissing') }}
                <VTooltip activator="parent">
                    {{ t('resultVisualizer.queryTelemetryVisualiser.help.hashMissing') }}
                </VTooltip>
            </VChip>
            <VChip v-if="prefetched" size="x-small" base-color="warning" color="warning">
                {{ t('resultVisualizer.queryTelemetryVisualiser.chip.prefetched') }}
                <VTooltip activator="parent">
                    {{ t('resultVisualizer.queryTelemetryVisualiser.help.prefetched') }}
                </VTooltip>
            </VChip>
            <VChip v-if="step.sortResolution != undefined" size="x-small">
                {{ step.sortResolution }}
                <VTooltip activator="parent">
                    <code>{{ sortResolutionArgument }}</code>
                </VTooltip>
            </VChip>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.telemetry-step-card {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 1px;
    padding: 0.25rem 0.5rem;
    overflow: hidden;
    border: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
    border-left: 4px solid;
    border-radius: 4px;
    font-size: 0.6875rem;
    color: rgb(var(--v-theme-on-surface));

    &--dark-ink {
        color: var(--telemetry-ink-on-phase);
    }

    &--dimmed {
        opacity: 0.55;
    }

    &__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.25rem;
        min-height: 1.125rem;
    }

    &__phase {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-weight: 700;
    }

    &__plan {
        flex: 0 0 auto;
        width: 1.125rem !important;
        height: 1.125rem !important;
        color: inherit;
    }

    &__plan-disabled {
        display: inline-flex;
    }

    &__body {
        display: flex;
        flex-direction: column;
        gap: 1px;
        min-width: 0;
    }

    &__argument-row {
        display: flex;
        gap: 0.375rem;
        min-height: 1em;
        white-space: nowrap;
    }

    &__argument {
        flex: 1 1 auto;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-family: monospace;
        opacity: 0.8;
    }

    &__cost {
        flex: 0 0 auto;
        font-variant-numeric: tabular-nums;
        opacity: 0.8;
    }

    &__numbers {
        display: flex;
        gap: 0.375rem;
        overflow: hidden;
        white-space: nowrap;
        font-variant-numeric: tabular-nums;

        span {
            opacity: 0.8;
        }
    }

    &__chips {
        display: flex;
        gap: 0.25rem;
        margin-top: auto;
        overflow: hidden;

        :deep(.v-chip) {
            flex: 0 0 auto;
        }
    }

    &__tooltip {
        display: grid;
        grid-template-columns: auto auto;
        column-gap: 1rem;

        strong {
            grid-column: 1 / -1;
        }
    }

    &__full-argument {
        grid-column: 1 / -1;
        white-space: normal;
        word-break: break-all;
    }
}
</style>
