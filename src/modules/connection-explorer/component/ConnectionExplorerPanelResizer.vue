<script setup lang="ts">
/**
 * Draggable edge of the connection explorer panel. Reports the width the user drags to, always within the
 * passed limits; persisting it is up to the panel, which is notified by `resizeEnd` once a drag is over.
 */

import { onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { defaultPanelWidth } from '@/modules/connection-explorer/model/panelWidth'

const props = defineProps<{
    /** Smallest width the panel may be resized to, in pixels. */
    min: number,
    /** Largest width the panel may be resized to on the current viewport, in pixels. */
    max: number
}>()
const emit = defineEmits<{
    (e: 'resizeEnd'): void
}>()
const width = defineModel<number>({ required: true })

const { t } = useI18n()

const dragging = ref<boolean>(false)
let dragStartX: number = 0
let dragStartWidth: number = 0
/** Width awaiting the next animation frame, coalescing all pointer moves within one frame into a single write. */
let pendingWidth: number | undefined = undefined
let pendingFrameId: number | undefined = undefined

/**
 * Fits a width into the current limits. When the viewport is too narrow to satisfy both, the minimum wins,
 * mirroring `clampPanelWidth`.
 */
function clamp(value: number): number {
    return Math.max(props.min, Math.min(Math.round(value), props.max))
}

function startDrag(e: PointerEvent): void {
    if (e.button !== 0) {
        return
    }
    e.preventDefault()

    dragging.value = true
    dragStartX = e.clientX
    dragStartWidth = width.value

    // capture keeps the drag alive over the tab area, whose editors would otherwise swallow the pointer
    const handle: Element = e.target as Element
    handle.setPointerCapture(e.pointerId)
    lockCursor()
}

function drag(e: PointerEvent): void {
    if (!dragging.value) {
        return
    }
    // every width change recomputes the whole Vuetify layout, so at most one is applied per frame
    pendingWidth = clamp(dragStartWidth + (e.clientX - dragStartX))
    if (pendingFrameId == undefined) {
        pendingFrameId = requestAnimationFrame(applyPendingWidth)
    }
}

function endDrag(e: PointerEvent): void {
    if (!dragging.value) {
        return
    }
    // the last move may still be waiting for its frame, and it is the width that gets persisted
    applyPendingWidth()

    dragging.value = false
    const target: Element = e.target as Element
    if (target.hasPointerCapture(e.pointerId)) {
        target.releasePointerCapture(e.pointerId)
    }
    unlockCursor()
    emit('resizeEnd')
}

function applyPendingWidth(): void {
    if (pendingFrameId != undefined) {
        cancelAnimationFrame(pendingFrameId)
        pendingFrameId = undefined
    }
    if (pendingWidth != undefined) {
        width.value = pendingWidth
        pendingWidth = undefined
    }
}

/**
 * Returns the panel to its original width, for users who dragged themselves into a corner.
 */
function resetWidth(): void {
    width.value = clamp(defaultPanelWidth)
    emit('resizeEnd')
}

/**
 * Forces the resize cursor and suppresses text selection for the entire page, so that a pointer outrunning
 * the panel edge doesn't flicker the cursor or select the workspace underneath.
 */
function lockCursor(): void {
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
}

function unlockCursor(): void {
    document.body.style.removeProperty('cursor')
    document.body.style.removeProperty('user-select')
}

onUnmounted(() => {
    // an interrupted drag must not leave the app unselectable
    if (pendingFrameId != undefined) {
        cancelAnimationFrame(pendingFrameId)
    }
    if (dragging.value) {
        unlockCursor()
    }
})
</script>

<template>
    <!-- the tooltip is disabled while dragging: it would otherwise sit under the pointer for the whole drag -->
    <VTooltip
        location="end"
        :disabled="dragging"
    >
        {{ t('explorer.resizer.tooltip') }}

        <template #activator="{ props }">
            <div
                v-bind="props"
                class="panel-resizer"
                :class="{ 'panel-resizer--dragging': dragging }"
                role="separator"
                aria-orientation="vertical"
                :aria-label="t('explorer.resizer.label')"
                @pointerdown="startDrag"
                @pointermove="drag"
                @pointerup="endDrag"
                @pointercancel="endDrag"
                @dblclick="resetWidth"
            />
        </template>
    </VTooltip>
</template>

<style lang="scss" scoped>
.panel-resizer {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    // wide enough to grab, while only the inner line is visible
    width: 0.5rem;
    cursor: col-resize;
    touch-action: none;
    z-index: 1;

    &::after {
        content: '';
        position: absolute;
        top: 0;
        bottom: 0;
        right: 0;
        width: 0.125rem;
        background-color: white;
        opacity: var(--v-border-opacity);
        transition: opacity 0.1s ease-in-out;
    }

    &:hover::after,
    &--dragging::after {
        opacity: 1;
    }
}
</style>
