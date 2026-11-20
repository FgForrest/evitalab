<script setup lang="ts">
/**
 * Steps tab: the subtree rooted at one step drawn top-down on the graph canvas as {@link TelemetryStepCard}s, under
 * the read-only path from the query root and the size of the subtree.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { List } from 'immutable'
import type {
    VisualisedQueryTelemetry
} from '@/modules/console/result-visualiser/model/query-telemetry/VisualisedQueryTelemetry'
import type {
    VisualisedTelemetryStep
} from '@/modules/console/result-visualiser/model/query-telemetry/VisualisedTelemetryStep'
import { layoutTree, type TreeLayout } from '@/modules/console/result-visualiser/service/query-telemetry/layoutTree'
import { telemetryStepLabel } from '@/modules/console/result-visualiser/service/query-telemetry/telemetryStepLabel'
import { formatNanos } from '@/utils/statisticsFormatting'
import TelemetryGraphCanvas from './TelemetryGraphCanvas.vue'
import TelemetryStepCard from './TelemetryStepCard.vue'

const { t } = useI18n()

const props = defineProps<{
    telemetry: VisualisedQueryTelemetry,
    /**
     * Root step of the tab.
     */
    step: VisualisedTelemetryStep
}>()
const emit = defineEmits<{
    (e: 'openPlan', stepId: string): void
}>()

const path = computed<List<VisualisedTelemetryStep>>(() => props.telemetry.pathTo(props.step.id))
const stepCount = computed<number>(() => props.telemetry.subtreeSize(props.step))

const layout = computed<TreeLayout<VisualisedTelemetryStep>>(() => layoutTree(props.step, {
    orientation: 'TB',
    w: 256,
    h: 88,
    gapMain: 34,
    gapCross: 12,
    children: node => node.children
}))
</script>

<template>
    <TelemetryGraphCanvas :layout="layout" :node-key="node => node.id">
        <template #toolbar>
            <div class="telemetry-steps__path">
                <template v-for="(pathStep, index) in path" :key="pathStep.id">
                    <span v-if="index > 0" class="text-disabled">›</span>
                    <span :class="{ 'telemetry-steps__current': index === path.size - 1, 'text-medium-emphasis': index < path.size - 1 }">
                        {{ telemetryStepLabel(pathStep) }}
                    </span>
                </template>
                <span class="text-disabled ml-2">
                    {{ t('resultVisualizer.queryTelemetryVisualiser.label.stepCount', stepCount, {
                        named: { count: stepCount, duration: formatNanos(step.spent) }
                    }) }}
                </span>
            </div>
            <div class="telemetry-steps__legend text-disabled">
                {{ t('resultVisualizer.queryTelemetryVisualiser.label.fillLegend', { title: telemetryStepLabel(step) }) }}
                · {{ t('resultVisualizer.queryTelemetryVisualiser.label.cardsReadOnly') }}
            </div>
        </template>
        <template #card="{ node }">
            <TelemetryStepCard
                :step="node"
                :root="step"
                :telemetry-root-id="telemetry.root.id"
                @open-plan="stepId => emit('openPlan', stepId)"
            />
        </template>
    </TelemetryGraphCanvas>
</template>

<style lang="scss" scoped>
.telemetry-steps {
    &__path {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.25rem;
        font-size: 0.75rem;
    }

    &__current {
        font-weight: 500;
    }

    &__legend {
        font-size: 0.75rem;
    }
}
</style>
