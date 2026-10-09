<script setup lang="ts">
/**
 * The four version watermarks of the commit pipeline, drawn as the pipeline they are.
 *
 * A transaction is *assigned* a version at conflict resolution, *written* once it is in the write-ahead log,
 * *durable* once that has been forced to disk, and *visible* once readers can see it. The watermarks are always in
 * that order, so it is the **gaps** that carry the meaning — each edge is labelled with its own, and each says what
 * that gap costs:
 *
 * - assigned → written: work accepted but not yet logged,
 * - written → durable: how much replay a crash would cost right now,
 * - durable → visible: how far behind readers are.
 *
 * A table of four numbers cannot show that they are one chain, which is why this is a diagram.
 */

import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
    CommitPipelineStatistics
} from '@/modules/database-driver/request-response/statistics/CommitPipelineStatistics'
import { formatNumber } from '@/modules/catalog-viewer/service/statisticsFormatting'

const { t } = useI18n()

const props = defineProps<{
    pipeline: CommitPipelineStatistics
}>()

/**
 * One watermark of the pipeline: its name, the catalog version it stands at, and the tooltip explaining it.
 */
interface PipelineStage {
    readonly label: string
    readonly version: bigint
    readonly description: string
}

/**
 * The gap between two consecutive watermarks, in catalog versions.
 */
interface PipelineEdge {
    readonly label: string
    readonly lag: bigint
    readonly description: string
}

/**
 * One stage together with the edge that *enters* it, so the template renders the chain without indexing a second
 * array — an off-by-one there would silently label an edge with the wrong gap. Pairing an edge with the stage
 * behind it also keeps the two on one line: the chain wraps between segments, never between an edge and the
 * watermark it points at.
 */
interface PipelineSegment {
    readonly stage: PipelineStage
    readonly edge: PipelineEdge | undefined
}

const stages = computed<PipelineStage[]>(() => [
    {
        label: t('catalogViewer.activity.pipeline.stage.assigned'),
        version: props.pipeline.lastAssignedCatalogVersion,
        description: t('catalogViewer.activity.pipeline.help.assigned')
    },
    {
        label: t('catalogViewer.activity.pipeline.stage.written'),
        version: props.pipeline.lastWrittenCatalogVersion,
        description: t('catalogViewer.activity.pipeline.help.written')
    },
    {
        label: t('catalogViewer.activity.pipeline.stage.durable'),
        version: props.pipeline.lastDurableCatalogVersion,
        description: t('catalogViewer.activity.pipeline.help.durable')
    },
    {
        label: t('catalogViewer.activity.pipeline.stage.visible'),
        version: props.pipeline.lastFinalizedCatalogVersion,
        description: t('catalogViewer.activity.pipeline.help.visible')
    }
])

const edges = computed<PipelineEdge[]>(() => [
    {
        label: t('catalogViewer.activity.pipeline.edge.assignedToWritten'),
        lag: props.pipeline.assignedToWritten,
        description: t('catalogViewer.activity.pipeline.help.assignedToWritten')
    },
    {
        label: t('catalogViewer.activity.pipeline.edge.writtenToDurable'),
        lag: props.pipeline.writtenToDurable,
        description: t('catalogViewer.activity.pipeline.help.writtenToDurable')
    },
    {
        label: t('catalogViewer.activity.pipeline.edge.durableToVisible'),
        lag: props.pipeline.durableToVisible,
        description: t('catalogViewer.activity.pipeline.help.durableToVisible')
    }
])

const segments = computed<PipelineSegment[]>(() =>
    stages.value.map((stage: PipelineStage, index: number) => ({ stage, edge: edges.value[index - 1] }))
)

/**
 * A lag of zero is the healthy state; anything above it is drawn in the warning colour so the eye finds the gap that
 * is actually open.
 */
function lagClass(lag: bigint): string | undefined {
    return lag > 0n ? 'text-warning' : undefined
}
</script>

<template>
    <div class="commit-pipeline">
        <div class="commit-pipeline__flow">
            <div v-for="segment in segments" :key="segment.stage.label" class="commit-pipeline__segment">
                <!--
                    the gap is named on the diagram, not only in its tooltip: it is the reading the diagram
                    exists for, and "2 versions" alone does not say between which two watermarks
                -->
                <div v-if="segment.edge != undefined" class="commit-pipeline__edge">
                    <div class="commit-pipeline__lag">
                        <div class="commit-pipeline__lag-label text-medium-emphasis">
                            {{ segment.edge.label }}
                        </div>
                        <div class="commit-pipeline__lag-value" :class="lagClass(segment.edge.lag)">
                            {{
                                t('catalogViewer.activity.pipeline.edge.value', {
                                    versions: formatNumber(segment.edge.lag)
                                })
                            }}
                        </div>
                        <VTooltip activator="parent">
                            {{ segment.edge.description }}
                        </VTooltip>
                    </div>
                    <VIcon size="small" class="commit-pipeline__arrow">mdi-arrow-right</VIcon>
                </div>

                <div class="commit-pipeline__stage">
                    <div class="commit-pipeline__stage-label text-medium-emphasis">
                        {{ segment.stage.label }}
                        <VIcon icon="mdi-information-outline" size="x-small" />
                        <VTooltip activator="parent">{{ segment.stage.description }}</VTooltip>
                    </div>
                    <div class="commit-pipeline__stage-version">{{ formatNumber(segment.stage.version) }}</div>
                </div>
            </div>

            <div class="commit-pipeline__depth">
                <span class="commit-pipeline__depth-label text-medium-emphasis">
                    {{ t('catalogViewer.activity.pipeline.depth') }}
                </span>
                <span
                    class="commit-pipeline__depth-value"
                    :class="lagClass(pipeline.pipelineDepth)"
                >
                    {{ formatNumber(pipeline.pipelineDepth) }}
                </span>
                <VTooltip activator="parent">
                    {{ t('catalogViewer.activity.pipeline.help.depth') }}
                </VTooltip>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.commit-pipeline {
    display: flex;
    flex-direction: column;
    align-items: start;
    gap: 0.75rem;

    &__flow {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.5rem;
    }

    &__stage {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
        padding: 0.5rem 0.75rem;
        min-width: 8rem;
        border: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
        border-radius: 4px;
        background-color: rgb(var(--v-theme-primary-dark));
    }

    &__stage-label {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        font-size: 0.75rem;
    }

    &__stage-version {
        font-variant-numeric: tabular-nums;
        font-weight: 500;
    }

    // an edge and the watermark it points at never separate, so a wrap always falls between two segments
    &__segment {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    // the named gap sits above the arrow it annotates, so the pair reads as one edge of the chain
    &__edge {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.125rem;
    }

    &__lag {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.125rem;
        padding: 0.25rem 0.5rem;
        border: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
        border-radius: 4px;
    }

    &__lag-label {
        font-size: 0.75rem;
        white-space: nowrap;
    }

    &__lag-value {
        font-size: 0.75rem;
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
    }

    &__arrow {
        opacity: 0.6;
    }

    &__depth {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-left: 0.5rem;
    }

    &__depth-label {
        font-size: 0.75rem;
    }

    &__depth-value {
        padding: 0.25rem 0.5rem;
        border: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
        border-radius: 4px;
        font-variant-numeric: tabular-nums;
        font-weight: 500;
    }
}
</style>
