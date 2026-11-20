<script setup lang="ts">
/**
 * Card of one formula in the Plan tab: the description with the state chip on the first row, `est · act · rows` on
 * the second; only the description is ellipsised. A group of similar
 * leaves is dashed with a `×N` badge and emits `openGroup` on click or Enter. Candidate plans and formulas that were not computed are dimmed; the
 * tooltip carries the instance id, the structural hash, the numbers and why a formula of the executed plan was not
 * computed.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type {
    VisualisedFormulaPlanNode
} from '@/modules/console/result-visualiser/model/query-telemetry/VisualisedFormulaPlanNode'
import { FormulaPlanNodeState } from '@/modules/console/result-visualiser/model/query-telemetry/FormulaPlanNodeState'
import { formatNumber, notApplicable } from '@/utils/statisticsFormatting'

const { t } = useI18n()

const props = defineProps<{
    node: VisualisedFormulaPlanNode,
    /**
     * `true` in the executed plan, `false` in a candidate plan.
     */
    executed: boolean,
    /**
     * `metrics.prefetched` of the query, which explains formulas of the executed plan that were not computed.
     */
    prefetched: boolean | undefined
}>()
const emit = defineEmits<{
    (e: 'openGroup'): void
}>()

function openGroup(): void {
    if (props.node.isGroup) {
        emit('openGroup')
    }
}

const state = computed<FormulaPlanNodeState>(() => props.node.state)
const dimmed = computed<boolean>(() => !props.executed || state.value === FormulaPlanNodeState.NotComputed)

const stateColor = computed<string | undefined>(() => {
    switch (state.value) {
        case FormulaPlanNodeState.Computed:
            return 'success'
        case FormulaPlanNodeState.NotComputed:
            return 'warning'
        default:
            return undefined
    }
})

const stateExplanation = computed<string | undefined>(() => {
    if (state.value === FormulaPlanNodeState.RanNotPriced) {
        return t('resultVisualizer.queryTelemetryVisualiser.help.ranNotPriced')
    }
    if (state.value !== FormulaPlanNodeState.NotComputed) {
        return undefined
    }
    if (!props.executed) {
        return t('resultVisualizer.queryTelemetryVisualiser.help.candidateNotComputed')
    }
    return props.prefetched === true
        ? t('resultVisualizer.queryTelemetryVisualiser.help.skippedPrefetched')
        : t('resultVisualizer.queryTelemetryVisualiser.help.skippedShortCircuited')
})
</script>

<template>
    <div
        :class="[
            'formula-plan-card',
            {
                'formula-plan-card--group': node.isGroup,
                'formula-plan-card--dimmed': dimmed
            }
        ]"
        :role="node.isGroup ? 'button' : undefined"
        :tabindex="node.isGroup ? 0 : undefined"
        @click="openGroup"
        @keydown.enter="openGroup"
        @keydown.space.prevent="openGroup"
    >
        <span v-if="node.isGroup" class="formula-plan-card__count">×{{ node.count }}</span>
        <span class="formula-plan-card__header">
            <span class="formula-plan-card__description">
                {{ node.description ?? t('resultVisualizer.queryTelemetryVisualiser.plan.reference') }}
            </span>
            <VChip
                size="x-small"
                :base-color="stateColor"
                :color="stateColor ?? 'gray-light'"
                class="formula-plan-card__state"
            >
                {{ t(`resultVisualizer.queryTelemetryVisualiser.plan.state.${state}`) }}
            </VChip>
        </span>
        <span class="formula-plan-card__numbers">
            <span>{{ t('resultVisualizer.queryTelemetryVisualiser.plan.estimated', { value: formatNumber(node.estimatedCost) }) }}</span>
            <span v-if="node.actualCost != undefined">
                {{ t('resultVisualizer.queryTelemetryVisualiser.plan.actual', { value: formatNumber(node.actualCost) }) }}
            </span>
            <span v-if="node.resultCount != undefined">
                {{ t('resultVisualizer.queryTelemetryVisualiser.plan.rows', { value: formatNumber(node.resultCount) }) }}
            </span>
        </span>

        <VTooltip activator="parent">
            <div class="formula-plan-card__tooltip">
                <code class="formula-plan-card__full">{{ node.description ?? '' }}</code>
                <template v-if="node.isGroup">
                    <span class="formula-plan-card__full text-medium-emphasis">
                        {{ t('resultVisualizer.queryTelemetryVisualiser.plan.collapsed', { count: node.count }) }}
                    </span>
                </template>
                <template v-else>
                    <span class="text-medium-emphasis">{{ t('resultVisualizer.queryTelemetryVisualiser.plan.instance') }}</span>
                    <span>#{{ node.formulaId }}</span>
                    <span class="text-medium-emphasis">{{ t('resultVisualizer.queryTelemetryVisualiser.plan.structuralHash') }}</span>
                    <code>{{ node.hash != undefined ? node.hash.toString() : notApplicable() }}</code>
                </template>
                <span class="text-medium-emphasis">{{ t('resultVisualizer.queryTelemetryVisualiser.plan.estimatedCost') }}</span>
                <span>{{ formatNumber(node.estimatedCost) }}</span>
                <span class="text-medium-emphasis">{{ t('resultVisualizer.queryTelemetryVisualiser.plan.actualCost') }}</span>
                <span>{{ formatNumber(node.actualCost) }}</span>
                <span class="text-medium-emphasis">{{ t('resultVisualizer.queryTelemetryVisualiser.plan.resultCount') }}</span>
                <span>{{ formatNumber(node.resultCount) }}</span>
                <span v-if="stateExplanation != undefined" class="formula-plan-card__full text-medium-emphasis">
                    {{ stateExplanation }}
                </span>
            </div>
        </VTooltip>
    </div>
</template>

<style lang="scss" scoped>
@use "@/styles/colors.scss" as *;

.formula-plan-card {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 2px;
    padding: 0.25rem 0.5rem;
    border: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
    border-radius: 4px;
    background: rgb(var(--v-theme-surface));
    font-size: 0.6875rem;

    &:hover {
        border-color: $gray-light;
    }

    &--group {
        border-style: dashed;
        border-color: $gray-light;
        cursor: pointer;

        &:hover,
        &:focus-visible {
            border-color: $primary-lightest;
        }
    }

    &--dimmed {
        opacity: 0.55;
    }

    &__count {
        position: absolute;
        top: -0.75rem;
        right: 0.5rem;
        height: 1rem;
        padding: 0 0.375rem;
        border: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
        border-radius: 0.5rem;
        background: $primary-light;
        font-size: 0.625rem;
        line-height: 0.875rem;
    }

    &__header {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        min-width: 0;
    }

    &__description {
        flex: 1 1 auto;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-family: monospace;
    }

    &__numbers {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        overflow: hidden;
        white-space: nowrap;
        font-variant-numeric: tabular-nums;
        color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
    }

    &__state {
        flex: 0 0 auto;
    }

    &__tooltip {
        display: grid;
        grid-template-columns: auto auto;
        column-gap: 1rem;
    }

    &__full {
        grid-column: 1 / -1;
        white-space: normal;
        word-break: break-all;
    }
}
</style>
