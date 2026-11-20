<script setup lang="ts">
/**
 * Icicle flamegraph of the whole step tree on a time axis: one absolutely positioned block per step, `left` from its
 * start and `width` from its spent time relative to the query total, one row per depth. A parent's time outside its
 * children is hatched at its right end. Clicking a block opens the step's Steps tab; blocks of steps with a formula
 * plan carry a plan button opening the Plan tab and are kept wide enough for it; such a widened block is shifted left
 * when it would overflow the right edge. Steps with an open tab are outlined.
 */
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type {
    VisualisedQueryTelemetry
} from '@/modules/console/result-visualiser/model/query-telemetry/VisualisedQueryTelemetry'
import type {
    VisualisedTelemetryStep
} from '@/modules/console/result-visualiser/model/query-telemetry/VisualisedTelemetryStep'
import { formatNanos, formatPercent } from '@/utils/statisticsFormatting'
import { telemetryStepLabel } from '@/modules/console/result-visualiser/service/query-telemetry/telemetryStepLabel'
import VActionTooltip from '@/modules/base/component/VActionTooltip.vue'

/**
 * Minimal block width in px, so that the shortest steps stay clickable.
 */
const minimalBlockWidth: number = 8
/**
 * Minimal width in px of a block carrying the plan button.
 */
const minimalPlanBlockWidth: number = 22
/**
 * Below this width in px a block shows no label.
 */
const minimalLabelWidth: number = 48
/**
 * Below this width in px a block with a plan shows the plan button only.
 */
const minimalPlanLabelWidth: number = 70
/**
 * Maximal length of the argument shown in the tooltip.
 */
const maxTooltipArgumentLength: number = 140

const { t } = useI18n()

const props = defineProps<{
    telemetry: VisualisedQueryTelemetry,
    openStepIds: ReadonlySet<string>
}>()
const emit = defineEmits<{
    (e: 'openSteps', stepId: string): void
    (e: 'openPlan', stepId: string): void
}>()

/**
 * Pre-computed geometry of one block.
 */
type FlamegraphBlock = {
    readonly step: VisualisedTelemetryStep,
    readonly left: string,
    readonly width: string,
    readonly top: string,
    readonly showLabel: boolean,
    readonly selfWidth: string | undefined
}

const flamegraphRef = ref<HTMLElement | undefined>()
/**
 * Width of the rows in px, `undefined` until it is measured; blocks keep their labels meanwhile, so the first paint
 * does not flash label-less blocks.
 */
const containerWidth = ref<number | undefined>(undefined)
let resizeObserver: ResizeObserver | undefined = undefined

function measureContainer(element: HTMLElement): void {
    containerWidth.value = element.clientWidth > 0 ? element.clientWidth : undefined
}

onMounted(() => {
    const element: HTMLElement | undefined = flamegraphRef.value
    if (element == undefined) {
        return
    }
    measureContainer(element)
    resizeObserver = new ResizeObserver(() => measureContainer(element))
    resizeObserver.observe(element)
})
onUnmounted(() => resizeObserver?.disconnect())

const height = computed<string>(() => `${(props.telemetry.maxDepth + 1) * 2.25}rem`)

const blocks = computed<FlamegraphBlock[]>(() => {
    const total: number = props.telemetry.total
    return props.telemetry.steps.map(step => {
        const leftShare: number = total === 0 ? 0 : step.start / total
        const widthShare: number = total === 0 ? 1 : step.spent / total
        const minimalWidth: number = step.planStepId != undefined ? minimalPlanBlockWidth : minimalBlockWidth
        const widthPx: number | undefined = containerWidth.value == undefined
            ? undefined
            : Math.max(widthShare * containerWidth.value, minimalWidth)
        const showLabel: boolean = widthPx == undefined || (step.planStepId != undefined
            ? widthPx >= minimalPlanLabelWidth
            : widthPx >= minimalLabelWidth)
        const hasSelfHatch: boolean = !step.children.isEmpty() && step.self != undefined && step.self > 0 &&
            (widthPx == undefined || widthPx > 8) && step.spent > 0
        const width: string = `max(${widthShare * 100}%, ${minimalWidth}px)`
        return {
            step,
            // a block widened to its minimal width near the right end is shifted left to stay inside the rows
            left: `max(0px, min(${leftShare * 100}%, calc(100% - ${width})))`,
            width,
            top: `${step.depth * 2.25}rem`,
            showLabel,
            selfWidth: hasSelfHatch ? `${(step.self ?? 0) / step.spent * 100}%` : undefined
        }
    }).toArray()
})

function planTooltip(step: VisualisedTelemetryStep): string {
    if (step.alternative?.winner === true) {
        return t('resultVisualizer.queryTelemetryVisualiser.button.showWinnerPlan')
    }
    return step.planStepId === props.telemetry.root.id
        ? t('resultVisualizer.queryTelemetryVisualiser.button.showExecutedPlan')
        : t('resultVisualizer.queryTelemetryVisualiser.button.showCandidatePlan')
}

function tooltipArgument(step: VisualisedTelemetryStep): string | undefined {
    const argument: string | undefined = step.firstArgument
    if (argument == undefined || argument.length <= maxTooltipArgumentLength) {
        return argument
    }
    return `${argument.substring(0, maxTooltipArgumentLength)}…`
}

function openPlan(step: VisualisedTelemetryStep): void {
    if (step.planStepId != undefined) {
        emit('openPlan', step.planStepId)
    }
}
</script>

<template>
    <div class="telemetry-flamegraph">
        <div ref="flamegraphRef" class="telemetry-flamegraph__rows" :style="{ height }">
            <div
                v-for="block in blocks"
                :key="block.step.id"
                :class="[
                    'telemetry-flamegraph__block',
                    `telemetry-flamegraph__block--${block.step.group}`,
                    {
                        'telemetry-flamegraph__block--open': openStepIds.has(block.step.id),
                        'telemetry-flamegraph__block--icon-only': !block.showLabel
                    }
                ]"
                :style="{ left: block.left, width: block.width, top: block.top }"
                tabindex="0"
                role="button"
                @click="emit('openSteps', block.step.id)"
                @keydown.enter="emit('openSteps', block.step.id)"
            >
                <span v-if="block.showLabel" class="telemetry-flamegraph__label">{{ telemetryStepLabel(block.step) }}</span>
                <span
                    v-if="block.selfWidth != undefined"
                    class="telemetry-flamegraph__self"
                    :style="{ width: block.selfWidth }"
                />
                <VBtn
                    v-if="block.step.planStepId != undefined"
                    icon
                    variant="flat"
                    density="compact"
                    size="x-small"
                    class="telemetry-flamegraph__plan"
                    @click.stop="openPlan(block.step)"
                    @keydown.enter.stop
                >
                    <VIcon size="small">mdi-file-tree-outline</VIcon>
                    <VActionTooltip location="top">
                        {{ planTooltip(block.step) }}
                    </VActionTooltip>
                </VBtn>

                <VTooltip activator="parent" location="bottom">
                    <div class="telemetry-flamegraph__tooltip">
                        <strong>{{ block.step.operation }}</strong>
                        <span class="text-medium-emphasis">{{ t('resultVisualizer.queryTelemetryVisualiser.label.spent') }}</span>
                        <span>{{ formatNanos(block.step.spent) }}</span>
                        <span class="text-medium-emphasis">{{ t('resultVisualizer.queryTelemetryVisualiser.label.self') }}</span>
                        <span>{{ formatNanos(block.step.self) }}</span>
                        <span class="text-medium-emphasis">{{ t('resultVisualizer.queryTelemetryVisualiser.label.ofTotal') }}</span>
                        <span>{{ formatPercent(block.step.shareOfTotal) }}</span>
                        <code v-if="tooltipArgument(block.step) != undefined" class="telemetry-flamegraph__argument">
                            {{ tooltipArgument(block.step) }}
                        </code>
                        <span v-if="block.step.plan != undefined" class="telemetry-flamegraph__argument text-medium-emphasis">
                            {{ t('resultVisualizer.queryTelemetryVisualiser.label.carriesPlan') }}
                        </span>
                    </div>
                </VTooltip>
            </div>
        </div>
        <div class="telemetry-flamegraph__axis text-disabled">
            <span>0</span>
            <span>{{ formatNanos(telemetry.total / 2) }}</span>
            <span>{{ formatNanos(telemetry.total) }}</span>
        </div>
    </div>
</template>

<style lang="scss" scoped>
@use "@/styles/colors.scss" as *;
@use "./telemetry-colors" as *;

.telemetry-flamegraph {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;

    &__rows {
        position: relative;
        width: 100%;
        overflow: hidden;
    }

    &__block {
        position: absolute;
        height: 2rem;
        display: flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0 0.25rem;
        overflow: hidden;
        border: 1.5px solid transparent;
        border-radius: 2px;
        background-clip: padding-box;
        cursor: pointer;
        color: var(--telemetry-ink-on-phase);
        font-size: 0.6875rem;
        font-weight: 500;
        white-space: nowrap;

        &:hover {
            filter: brightness(1.12);
        }

        &:focus-visible {
            outline: 2px solid $primary-lightest;
            outline-offset: 1px;
        }

        &--root {
            background-color: var(--telemetry-root);
            color: rgb(var(--v-theme-on-surface));
        }

        &--planning {
            background-color: var(--telemetry-planning);
        }

        &--execution {
            background-color: var(--telemetry-execution);
        }

        &--fetching {
            background-color: var(--telemetry-fetching);
        }

        &--open {
            border-color: $primary-lightest;
        }

        &--icon-only {
            justify-content: center;
            padding: 0;
        }
    }

    &__label {
        flex: 1 1 auto;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    &__self {
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        background: $telemetry-self-hatch;
        pointer-events: none;
    }

    &__plan {
        position: relative;
        z-index: 1;
        flex: 0 0 auto;
        width: 1.125rem !important;
        height: 1.125rem !important;
        min-width: 0;
        border-radius: 3px;
        background: rgba($white, 0.35);
        color: var(--telemetry-ink-on-phase);

        &:hover {
            background: $white;
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

    &__argument {
        grid-column: 1 / -1;
        white-space: normal;
        word-break: break-all;
    }

    &__axis {
        display: flex;
        justify-content: space-between;
        padding-top: 0.125rem;
        border-top: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
        font-size: 0.6875rem;
    }
}
</style>
