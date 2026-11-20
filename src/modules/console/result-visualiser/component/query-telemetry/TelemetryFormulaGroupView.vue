<script setup lang="ts">
/**
 * Group tab: the members of one group of similar formulas of a plan, drawn one by one as {@link FormulaPlanCard}s in a
 * grid on the graph canvas, so that their own hashes and numbers can be compared.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type {
    VisualisedQueryTelemetry
} from '@/modules/console/result-visualiser/model/query-telemetry/VisualisedQueryTelemetry'
import type {
    VisualisedTelemetryStep
} from '@/modules/console/result-visualiser/model/query-telemetry/VisualisedTelemetryStep'
import type {
    VisualisedFormulaPlanNode
} from '@/modules/console/result-visualiser/model/query-telemetry/VisualisedFormulaPlanNode'
import {
    visualiseFormulaGroupMembers
} from '@/modules/console/result-visualiser/service/query-telemetry/visualiseFormulaPlan'
import { layoutGrid, type TreeLayout } from '@/modules/console/result-visualiser/service/query-telemetry/layoutTree'
import { telemetryStepLabel } from '@/modules/console/result-visualiser/service/query-telemetry/telemetryStepLabel'
import { formatNumber } from '@/utils/statisticsFormatting'
import TelemetryGraphCanvas from './TelemetryGraphCanvas.vue'
import FormulaPlanCard from './FormulaPlanCard.vue'

const { t } = useI18n()

const props = defineProps<{
    telemetry: VisualisedQueryTelemetry,
    /**
     * Step whose plan the group belongs to.
     */
    step: VisualisedTelemetryStep,
    /**
     * Group node of the plan whose members are listed.
     */
    group: VisualisedFormulaPlanNode
}>()

const executed = computed<boolean>(() => props.step.id === props.telemetry.root.id)

const layout = computed<TreeLayout<VisualisedFormulaPlanNode>>(() =>
    layoutGrid(visualiseFormulaGroupMembers(props.group).toArray(), { w: 272, h: 64, gap: 14 })
)
</script>

<template>
    <TelemetryGraphCanvas
        :layout="layout"
        :node-key="node => node.key"
    >
        <template #toolbar>
            <div class="telemetry-formula-group__caption">
                <span class="telemetry-formula-group__title">
                    {{ t('resultVisualizer.queryTelemetryVisualiser.plan.groupCaption', {
                        title: group.description ?? '',
                        count: formatNumber(group.count),
                        step: telemetryStepLabel(step)
                    }) }}
                </span>
                <span class="text-disabled">
                    {{ t('resultVisualizer.queryTelemetryVisualiser.plan.estimated', { value: formatNumber(group.estimatedCost) }) }}
                    <template v-if="group.actualCost != undefined">
                        · {{ t('resultVisualizer.queryTelemetryVisualiser.plan.actual', { value: formatNumber(group.actualCost) }) }}
                    </template>
                    <template v-if="group.resultCount != undefined">
                        · {{ t('resultVisualizer.queryTelemetryVisualiser.plan.rows', { value: formatNumber(group.resultCount) }) }}
                    </template>
                </span>
            </div>
            <div class="telemetry-formula-group__note text-disabled">
                {{ t('resultVisualizer.queryTelemetryVisualiser.plan.groupNote') }}
            </div>
        </template>
        <template #card="{ node }">
            <FormulaPlanCard
                :node="node"
                :executed="executed"
                :prefetched="telemetry.metrics?.prefetched"
            />
        </template>
    </TelemetryGraphCanvas>
</template>

<style lang="scss" scoped>
.telemetry-formula-group {
    &__caption {
        display: flex;
        flex-wrap: wrap;
        gap: 0.25rem 1rem;
        font-size: 0.75rem;
    }

    &__title {
        font-weight: 500;
    }

    &__note {
        font-size: 0.75rem;
    }
}
</style>
