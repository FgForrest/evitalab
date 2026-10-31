<script setup lang="ts">
/**
 * Header cell of a single {@link VDataGrid} column: leading icons, ellipsized title, trailing icons, sort indicator
 * and a resize handle on the right edge.
 */

import { computed } from 'vue'
import type { DataGridColumn } from '@/modules/base/model/data-grid/DataGridColumn'
import type { DataGridSortOrder } from '@/modules/base/model/data-grid/DataGridSortItem'
import { clampResizedColumnWidth } from '@/modules/base/service/data-grid/dataGridColumnWidth'

const props = defineProps<{
    column: Pick<DataGridColumn, 'key' | 'title' | 'sortable' | 'prependIcons' | 'appendIcons'>,
    /**
     * Sort order of this column, undefined if the column is not sorted.
     */
    sortOrder: DataGridSortOrder | undefined,
    /**
     * Current width of the column in pixels, the starting point of a resize.
     */
    width: number
}>()
const emit = defineEmits<{
    (e: 'toggleSort'): void
    (e: 'resize', width: number): void
    (e: 'resetWidth'): void
}>()

const sortIcon = computed<string | undefined>(() => {
    if (props.sortOrder === 'asc') {
        return 'mdi-arrow-up'
    } else if (props.sortOrder === 'desc') {
        return 'mdi-arrow-down'
    } else if (props.column.sortable) {
        return 'mdi-sort'
    }
    return undefined
})
const ariaSort = computed<'ascending' | 'descending' | 'none' | undefined>(() => {
    if (!props.column.sortable) {
        return undefined
    }
    return props.sortOrder === 'asc' ? 'ascending' : props.sortOrder === 'desc' ? 'descending' : 'none'
})

function handleClick(): void {
    if (props.column.sortable) {
        emit('toggleSort')
    }
}

function startResize(e: PointerEvent): void {
    if (e.button !== 0) {
        return
    }
    const handle: HTMLElement = e.currentTarget as HTMLElement
    const startX: number = e.clientX
    const startWidth: number = props.width
    handle.setPointerCapture(e.pointerId)

    const onMove = (moveEvent: PointerEvent): void => {
        emit('resize', clampResizedColumnWidth(startWidth + moveEvent.clientX - startX))
    }
    const onEnd = (): void => {
        handle.removeEventListener('pointermove', onMove)
        handle.removeEventListener('pointerup', onEnd)
        handle.removeEventListener('pointercancel', onEnd)
    }
    handle.addEventListener('pointermove', onMove)
    handle.addEventListener('pointerup', onEnd)
    handle.addEventListener('pointercancel', onEnd)
}
</script>

<template>
    <th
        :class="['data-grid-column-header', { 'data-grid-column-header--sortable': column.sortable }]"
        :aria-sort="ariaSort"
        @click="handleClick"
    >
        <div class="data-grid-column-header__content">
            <VIcon v-for="icon in column.prependIcons" :key="icon" class="data-grid-column-header__icon">{{ icon }}</VIcon>
            <span class="data-grid-column-header__title">
                {{ column.title }}
                <VTooltip activator="parent" location="bottom" open-delay="500">
                    {{ column.title }}
                </VTooltip>
            </span>
            <VIcon v-for="icon in column.appendIcons" :key="icon" class="data-grid-column-header__icon">{{ icon }}</VIcon>
            <VIcon v-if="sortIcon" class="data-grid-column-header__icon data-grid-column-header__sort">{{ sortIcon }}</VIcon>
        </div>
        <span
            class="data-grid-column-header__resize-handle"
            @pointerdown="startResize"
            @click.stop
            @dblclick.stop="emit('resetWidth')"
        />
    </th>
</template>

<style lang="scss" scoped>
.data-grid-column-header {
    position: relative;
    overflow: hidden;

    &--sortable {
        cursor: pointer;
    }

    &__content {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        min-width: 0;
    }

    &__title {
        flex: 0 1 auto;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    &__icon {
        flex-shrink: 0;
    }

    &__sort {
        margin-left: auto;
    }

    &__resize-handle {
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        width: 7px;
        cursor: col-resize;
        z-index: 1;
        touch-action: none;

        &:hover,
        &:active {
            background: rgba(var(--v-theme-primary-lightest), 0.5);
            background-clip: content-box;
            padding-left: 4px;
        }
    }
}
</style>
