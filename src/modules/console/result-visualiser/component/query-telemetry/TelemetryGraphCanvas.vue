<script setup lang="ts" generic="T">
/**
 * Pan-and-zoom canvas for a laid-out node-link graph, shared by the Steps and the Plan tab. One transformed wrapper
 * holds an SVG edge layer under absolutely positioned HTML cards rendered by the `card` slot (sized by the layout, so
 * nothing has to be measured). Dragging pans, the wheel pans, Ctrl + wheel zooms around the cursor; the wheel never
 * scrolls the page. The graph is fitted on open and on the fit button, never scaled above 1× nor below
 * {@link minFitScale} (a larger graph is panned instead). A resized canvas is fitted again unless the user has zoomed
 * or panned since the last fit. Text selection is suppressed while dragging. A drag starts only once the pointer moves
 * by {@link dragThreshold} px, so a plain click still reaches the card under it; the click ending a drag does not.
 */
import { computed, nextTick, onMounted, onUnmounted, ref, useId, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { LaidOutEdge, LaidOutNode, TreeLayout } from '@/modules/console/result-visualiser/service/query-telemetry/layoutTree'
import VActionTooltip from '@/modules/base/component/VActionTooltip.vue'

/**
 * Padding in px kept around the graph when fitting.
 */
const fitPadding: number = 10
const zoomStep: number = 1.2
const wheelZoomStep: number = 1.1
const minScale: number = 0.05
/**
 * Smallest scale fitting may choose, so that the cards stay readable.
 */
const minFitScale: number = 0.5
const maxScale: number = 4
/**
 * Distance in px the pointer has to move with the button pressed before the press turns into a drag.
 */
const dragThreshold: number = 4

const { t } = useI18n()

const props = defineProps<{
    layout: TreeLayout<T>,
    /**
     * Unique key of a node for list rendering.
     */
    nodeKey: (node: T) => string,
    /**
     * Tooltip of a back-reference edge.
     */
    refEdgeTooltip?: string
}>()
defineSlots<{
    card(props: { node: T, laidOut: LaidOutNode<T> }): unknown,
    toolbar(): unknown,
    /**
     * Controls placed on the right of the toolbar, before the zoom buttons.
     */
    actions?(): unknown
}>()

const markerId: string = `telemetry-graph-arrow-${useId()}`

const canvasRef = ref<HTMLElement | undefined>()
const scale = ref<number>(1)
const translateX = ref<number>(fitPadding)
const translateY = ref<number>(fitPadding)
const dragOrigin = ref<{ x: number, y: number } | undefined>()
/**
 * Where the primary button was pressed, until it is released.
 */
let pressOrigin: { x: number, y: number } | undefined = undefined
/**
 * The press being released was a drag, so the click it produces is swallowed.
 */
let dragJustEnded: boolean = false
/**
 * The user zoomed or panned since the last fit, so a resize keeps their view.
 */
let adjustedByUser: boolean = false
let resizeObserver: ResizeObserver | undefined = undefined

const transform = computed<string>(() =>
    `translate(${translateX.value}px, ${translateY.value}px) scale(${scale.value})`
)

/**
 * SVG path of an edge: a horizontal or vertical cubic curve between the facing sides of the two cards; a
 * back-reference arcs below the cards into the bottom of its target.
 */
function edgePath(edge: LaidOutEdge<T>): string {
    const { from, to } = edge
    if (props.layout.orientation === 'LR') {
        const x1: number = from.x + from.w
        const y1: number = from.y + from.h / 2
        if (edge.ref) {
            const x2: number = to.x + to.w / 2
            const y2: number = to.y + to.h
            return `M${x1},${y1} C${x1 + 40},${y1 + 40} ${x2},${y2 + 60} ${x2},${y2}`
        }
        const x2: number = to.x
        const y2: number = to.y + to.h / 2
        const bend: number = Math.max(30, (x2 - x1) / 2)
        return `M${x1},${y1} C${x1 + bend},${y1} ${x2 - bend},${y2} ${x2},${y2}`
    }
    const x1: number = from.x + from.w / 2
    const y1: number = from.y + from.h
    const x2: number = to.x + to.w / 2
    const y2: number = to.y
    const bend: number = Math.max(16, (y2 - y1) / 2)
    return `M${x1},${y1} C${x1},${y1 + bend} ${x2},${y2 - bend} ${x2},${y2}`
}

function fit(): void {
    const canvas: HTMLElement | undefined = canvasRef.value
    if (canvas == undefined || props.layout.width === 0 || props.layout.height === 0) {
        return
    }
    const availableWidth: number = canvas.clientWidth - 2 * fitPadding
    const availableHeight: number = canvas.clientHeight - 2 * fitPadding
    scale.value = Math.max(minFitScale, Math.min(1, availableWidth / props.layout.width, availableHeight / props.layout.height))
    translateX.value = Math.max(fitPadding, (canvas.clientWidth - props.layout.width * scale.value) / 2)
    translateY.value = fitPadding
    adjustedByUser = false
}

function scheduleFit(): void {
    nextTick(() => requestAnimationFrame(fit))
}

/**
 * Zooms by `factor` keeping the canvas point `(x, y)` in place.
 */
function zoomAround(factor: number, x: number, y: number): void {
    const newScale: number = Math.min(maxScale, Math.max(minScale, scale.value * factor))
    const applied: number = newScale / scale.value
    translateX.value = x - (x - translateX.value) * applied
    translateY.value = y - (y - translateY.value) * applied
    scale.value = newScale
    adjustedByUser = true
}

function zoomCentered(factor: number): void {
    const canvas: HTMLElement | undefined = canvasRef.value
    if (canvas == undefined) {
        return
    }
    zoomAround(factor, canvas.clientWidth / 2, canvas.clientHeight / 2)
}

function handleWheel(event: WheelEvent): void {
    event.preventDefault()
    if (!event.ctrlKey) {
        translateX.value -= event.deltaX
        translateY.value -= event.deltaY
        adjustedByUser = true
        return
    }
    const canvas: HTMLElement | undefined = canvasRef.value
    if (canvas == undefined) {
        return
    }
    const bounds: DOMRect = canvas.getBoundingClientRect()
    zoomAround(event.deltaY < 0 ? wheelZoomStep : 1 / wheelZoomStep, event.clientX - bounds.left, event.clientY - bounds.top)
}

function handlePointerDown(event: PointerEvent): void {
    dragJustEnded = false
    if (event.button !== 0 || (event.target instanceof Element && event.target.closest('button, a, .v-btn') != undefined)) {
        return
    }
    pressOrigin = { x: event.clientX, y: event.clientY }
}

function handlePointerMove(event: PointerEvent): void {
    if (dragOrigin.value == undefined) {
        // the button was released outside the canvas before the press turned into a drag
        if (event.buttons === 0) {
            pressOrigin = undefined
            return
        }
        if (pressOrigin == undefined ||
            Math.hypot(event.clientX - pressOrigin.x, event.clientY - pressOrigin.y) < dragThreshold) {
            return
        }
        dragOrigin.value = { x: pressOrigin.x - translateX.value, y: pressOrigin.y - translateY.value }
        canvasRef.value?.setPointerCapture(event.pointerId)
    }
    translateX.value = event.clientX - dragOrigin.value.x
    translateY.value = event.clientY - dragOrigin.value.y
    adjustedByUser = true
}

function handlePointerUp(event: PointerEvent): void {
    pressOrigin = undefined
    if (dragOrigin.value == undefined) {
        return
    }
    dragOrigin.value = undefined
    dragJustEnded = true
    canvasRef.value?.releasePointerCapture(event.pointerId)
}

function handleClickCapture(event: MouseEvent): void {
    if (dragJustEnded) {
        dragJustEnded = false
        event.stopPropagation()
    }
}

onMounted(() => {
    scheduleFit()
    const canvas: HTMLElement | undefined = canvasRef.value
    if (canvas == undefined) {
        return
    }
    resizeObserver = new ResizeObserver(() => {
        if (!adjustedByUser) {
            fit()
        }
    })
    resizeObserver.observe(canvas)
})
onUnmounted(() => resizeObserver?.disconnect())
watch(() => props.layout, scheduleFit)
</script>

<template>
    <div class="telemetry-graph">
        <div class="telemetry-graph__toolbar">
            <div class="telemetry-graph__caption">
                <slot name="toolbar" />
            </div>
            <slot name="actions" />
            <div class="telemetry-graph__zoom">
                <VBtn icon density="compact" variant="text" @click="zoomCentered(zoomStep)">
                    <VIcon>mdi-plus</VIcon>
                    <VActionTooltip>{{ t('resultVisualizer.queryTelemetryVisualiser.button.zoomIn') }}</VActionTooltip>
                </VBtn>
                <VBtn icon density="compact" variant="text" @click="zoomCentered(1 / zoomStep)">
                    <VIcon>mdi-minus</VIcon>
                    <VActionTooltip>{{ t('resultVisualizer.queryTelemetryVisualiser.button.zoomOut') }}</VActionTooltip>
                </VBtn>
                <VBtn icon density="compact" variant="text" @click="fit">
                    <VIcon>mdi-fit-to-screen-outline</VIcon>
                    <VActionTooltip>{{ t('resultVisualizer.queryTelemetryVisualiser.button.fit') }}</VActionTooltip>
                </VBtn>
            </div>
        </div>

        <div
            ref="canvasRef"
            :class="['telemetry-graph__canvas', { 'telemetry-graph__canvas--dragging': dragOrigin != undefined }]"
            @wheel="handleWheel"
            @pointerdown="handlePointerDown"
            @pointermove="handlePointerMove"
            @pointerup="handlePointerUp"
            @pointercancel="handlePointerUp"
            @click.capture="handleClickCapture"
        >
            <div class="telemetry-graph__world" :style="{ transform }">
                <svg
                    class="telemetry-graph__edges"
                    :width="layout.width"
                    :height="layout.height"
                >
                    <defs>
                        <marker
                            :id="markerId"
                            viewBox="0 0 10 10"
                            refX="9"
                            refY="5"
                            markerWidth="6"
                            markerHeight="6"
                            orient="auto-start-reverse"
                        >
                            <path d="M0,0 L10,5 L0,10 z" class="telemetry-graph__arrow" />
                        </marker>
                    </defs>
                    <path
                        v-for="(edge, index) in layout.edges"
                        :key="index"
                        :d="edgePath(edge)"
                        :class="['telemetry-graph__edge', { 'telemetry-graph__edge--ref': edge.ref }]"
                        :marker-end="edge.ref ? `url(#${markerId})` : undefined"
                    >
                        <title v-if="edge.ref && refEdgeTooltip != undefined">{{ refEdgeTooltip }}</title>
                    </path>
                </svg>
                <div
                    v-for="laidOut in layout.nodes"
                    :key="nodeKey(laidOut.node)"
                    class="telemetry-graph__card"
                    :style="{ left: `${laidOut.x}px`, top: `${laidOut.y}px`, width: `${laidOut.w}px`, height: `${laidOut.h}px` }"
                >
                    <slot name="card" :node="laidOut.node" :laid-out="laidOut" />
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
@use "@/styles/colors.scss" as *;

.telemetry-graph {
    flex: 1 1 auto;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    &__toolbar {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.5rem;
    }

    &__caption {
        flex: 1 1 auto;
        min-width: 0;
    }

    &__zoom {
        display: flex;
        gap: 0.25rem;
    }

    &__canvas {
        position: relative;
        flex: 1 1 auto;
        min-height: 24rem;
        overflow: hidden;
        border: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
        border-radius: 4px;
        background: $primary-dark;
        cursor: grab;
        touch-action: none;

        &--dragging {
            cursor: grabbing;
            user-select: none;
        }
    }

    &__world {
        position: absolute;
        top: 0;
        left: 0;
        transform-origin: 0 0;
    }

    &__edges {
        position: absolute;
        top: 0;
        left: 0;
        overflow: visible;
    }

    &__edge {
        fill: none;
        stroke: rgba(var(--v-theme-on-surface), var(--v-disabled-opacity));
        stroke-width: 1.5;

        &--ref {
            stroke: $primary-lightest;
            stroke-dasharray: 5 4;
            pointer-events: stroke;
        }
    }

    &__arrow {
        fill: $primary-lightest;
    }

    &__card {
        position: absolute;
    }
}
</style>
