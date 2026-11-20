<script setup lang="ts">
/**
 * Plan tab: the formula plan of one step (the executed plan of `OVERALL` or the candidate plan of an alternative)
 * drawn left-to-right on the graph canvas as {@link FormulaPlanCard}s, with runs of similar leaves grouped (a click on
 * a group opens its members in a Group tab) and back-references (`refTo`) as dashed edges to the shared formula. The
 * executed plan can leave out the formulas that were not computed.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type {
    VisualisedQueryTelemetry
} from '@/modules/console/result-visualiser/model/query-telemetry/VisualisedQueryTelemetry'
import type {
    VisualisedTelemetryStep
} from '@/modules/console/result-visualiser/model/query-telemetry/VisualisedTelemetryStep'
import type { VisualisedFormulaPlan } from '@/modules/console/result-visualiser/model/query-telemetry/VisualisedFormulaPlan'
import type {
    VisualisedFormulaPlanNode
} from '@/modules/console/result-visualiser/model/query-telemetry/VisualisedFormulaPlanNode'
import { visualiseFormulaPlan } from '@/modules/console/result-visualiser/service/query-telemetry/visualiseFormulaPlan'
import { layoutTree, type TreeLayout } from '@/modules/console/result-visualiser/service/query-telemetry/layoutTree'
import { telemetryStepLabel } from '@/modules/console/result-visualiser/service/query-telemetry/telemetryStepLabel'
import { formatNumber } from '@/utils/statisticsFormatting'
import VMissingDataIndicator from '@/modules/base/component/VMissingDataIndicator.vue'
import TelemetryGraphCanvas from './TelemetryGraphCanvas.vue'
import FormulaPlanCard from './FormulaPlanCard.vue'

const { t } = useI18n()

const props = defineProps<{
    telemetry: VisualisedQueryTelemetry,
    /**
     * Step whose plan is shown.
     */
    step: VisualisedTelemetryStep
}>()
const emit = defineEmits<{
    (e: 'openGroup', group: VisualisedFormulaPlanNode): void
}>()
/**
 * Whether formulas that were not computed are left out; applies to the executed plan only.
 */
const hideNotComputed = defineModel<boolean>('hideNotComputed', { default: false })

const executed = computed<boolean>(() => props.step.id === props.telemetry.root.id)

/**
 * A candidate plan is never computed as a whole, so the filter is offered only for an executed plan that has a formula
 * to hide.
 */
const notComputedFilterAvailable = computed<boolean>(() => {
    if (!executed.value || props.step.plan == undefined) {
        return false
    }
    return visualiseFormulaPlan(props.step.id, true, props.step.plan, true).hiddenCount > 0
})

const plan = computed<VisualisedFormulaPlan | undefined>(() => {
    if (props.step.plan == undefined) {
        return undefined
    }
    return visualiseFormulaPlan(
        props.step.id,
        executed.value,
        props.step.plan,
        notComputedFilterAvailable.value && hideNotComputed.value
    )
})

const layout = computed<TreeLayout<VisualisedFormulaPlanNode> | undefined>(() => {
    if (plan.value == undefined) {
        return undefined
    }
    return layoutTree(plan.value.root, {
        orientation: 'LR',
        w: 272,
        h: 64,
        gapMain: 60,
        gapCross: 14,
        children: node => node.children,
        nodeId: node => node.key,
        isRef: node => node.isReference,
        refTarget: node => node.refKey
    })
})

const caption = computed<string>(() => plan.value?.executed === true
    ? t('resultVisualizer.queryTelemetryVisualiser.plan.executedCaption', { title: telemetryStepLabel(props.step) })
    : t('resultVisualizer.queryTelemetryVisualiser.plan.candidateCaption', { title: telemetryStepLabel(props.step) })
)
</script>

<template>
    <TelemetryGraphCanvas
        v-if="plan != undefined && layout != undefined"
        :layout="layout"
        :node-key="node => node.key"
        :ref-edge-tooltip="t('resultVisualizer.queryTelemetryVisualiser.plan.refEdge')"
    >
        <template #toolbar>
            <div class="telemetry-plan__caption">
                <span class="telemetry-plan__title">{{ caption }}</span>
                <span class="text-disabled">
                    {{ t('resultVisualizer.queryTelemetryVisualiser.plan.counts', {
                        formulas: formatNumber(plan.formulaCount),
                        shared: formatNumber(plan.sharedCount)
                    }) }}
                    <template v-if="plan.hiddenCount > 0">
                        {{ t('resultVisualizer.queryTelemetryVisualiser.plan.hiddenCount', { count: formatNumber(plan.hiddenCount) }) }}
                    </template>
                </span>
            </div>
            <div class="telemetry-plan__legend text-disabled">
                <span class="telemetry-plan__legend-item">
                    <span class="telemetry-plan__line" />
                    {{ t('resultVisualizer.queryTelemetryVisualiser.plan.legendTreeEdge') }}
                </span>
                <span class="telemetry-plan__legend-item">
                    <span class="telemetry-plan__line telemetry-plan__line--ref" />
                    {{ t('resultVisualizer.queryTelemetryVisualiser.plan.legendRefEdge') }}
                </span>
                <span class="telemetry-plan__legend-item">
                    <span class="telemetry-plan__box" />
                    {{ t('resultVisualizer.queryTelemetryVisualiser.plan.legendCollapsed') }}
                </span>
            </div>
        </template>
        <template v-if="notComputedFilterAvailable" #actions>
            <VChipGroup
                :model-value="hideNotComputed ? undefined : true"
                variant="outlined"
                class="telemetry-plan__filter"
                @update:model-value="hideNotComputed = $event !== true"
            >
                <VChip :value="true" filter size="x-small">
                    {{ t('resultVisualizer.queryTelemetryVisualiser.plan.showNotComputed') }}
                    <VTooltip activator="parent">
                        {{ t('resultVisualizer.queryTelemetryVisualiser.help.showNotComputed') }}
                    </VTooltip>
                </VChip>
            </VChipGroup>
        </template>
        <template #card="{ node }">
            <FormulaPlanCard
                :node="node"
                :executed="plan.executed"
                :prefetched="telemetry.metrics?.prefetched"
                @open-group="emit('openGroup', node)"
            />
        </template>
    </TelemetryGraphCanvas>
    <VMissingDataIndicator v-else icon="mdi-file-tree-outline" />
</template>

<style lang="scss" scoped>
@use "@/styles/colors.scss" as *;

.telemetry-plan {
    &__caption {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.25rem 1rem;
        font-size: 0.75rem;
    }

    &__filter {
        flex: 0 0 auto;
        padding: 0;
    }

    &__title {
        font-weight: 500;
    }

    &__legend {
        display: flex;
        flex-wrap: wrap;
        gap: 0.25rem 1rem;
        font-size: 0.75rem;
    }

    &__legend-item {
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
    }

    &__line {
        width: 1rem;
        border-top: 1.5px solid rgba(var(--v-theme-on-surface), var(--v-disabled-opacity));

        &--ref {
            border-top: 1.5px dashed $primary-lightest;
        }
    }

    &__box {
        width: 0.75rem;
        height: 0.5rem;
        border: 1px dashed $gray-light;
        border-radius: 2px;
    }
}
</style>
