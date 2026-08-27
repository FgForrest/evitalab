<script setup lang="ts">
/**
 * Pre-configured VTabs component for vertical tabs.
 *
 * The component has two independent models:
 * - `modelValue` — which view of the controlled panel is displayed. It always holds a view, even while
 *   the panel is collapsed, so that reopening the panel returns to the view it had.
 * - `visible` — whether the controlled panel is displayed at all. Only meaningful together with the
 *   `collapsible` prop.
 */

import { computed } from 'vue'

enum Side {
    Left = 'left',
    Right = 'right'
}

const props = defineProps<{
    /** Currently displayed view. Stays set while the controlled panel is collapsed. */
    modelValue: unknown,
    side: 'left' | 'right',
    /**
     * Whether the panel this strip controls is displayed. Expected to be bound whenever `collapsible`
     * is used; an unbound `visible` is treated as "panel is displayed".
     */
    visible?: boolean,
    /** Allows the controlled panel to be collapsed by clicking the currently active tab. */
    collapsible?: boolean
}>()
const emit = defineEmits<{
    (e: 'update:modelValue', value: unknown): void,
    (e: 'update:visible', value: boolean): void
}>()

/**
 * Whether the controlled panel is currently collapsed. Deliberately compared against an explicit
 * `false` so that a `collapsible` strip with an unbound `visible` doesn't mount collapsed.
 */
const collapsed = computed<boolean>(() => props.collapsible === true && props.visible === false)

/**
 * No tab is highlighted while the controlled panel is collapsed, but the selected view is remembered
 * in `modelValue` for the moment the panel is reopened.
 */
const selectedTab = computed<unknown>(() => collapsed.value ? undefined : props.modelValue)

/**
 * Translates the deselection of an active tab (only possible with `collapsible`) into a request to
 * collapse the controlled panel. Selecting any tab of a collapsed panel displays it again.
 */
function handleTabChange(value: unknown): void {
    if (value == undefined) {
        emit('update:visible', false)
        return
    }
    emit('update:modelValue', value)
    if (collapsed.value) {
        emit('update:visible', true)
    }
}
</script>

<template>
    <VTabs
        :model-value="selectedTab"
        :mandatory="collapsible === true ? false : 'force'"
        @update:model-value="handleTabChange($event)"
        direction="vertical"
        :class="['side-tabs', { 'side-tabs--left': side === Side.Left }, { 'side-tabs--right': side === Side.Right }]"
    >
        <slot />
    </VTabs>
</template>

<style lang="scss" scoped>
@use "@/styles/colors.scss" as *;
.side-tabs {
    background: $primary-dark;
    width: 3rem;

    &--left {
        border-right: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
    }

    &--right {
        border-left: thin solid rgba(var(--v-border-color), var(--v-border-opacity));

        // Vuetify anchors the slider of vertical tabs to the left edge of the tab, which is the outer
        // edge of a left-side strip only; the right-side strip mirrors it so that the indicator always
        // sits on the edge facing away from the panel it controls
        & :deep(.v-tab__slider) {
            left: auto;
            right: 0;
        }
    }

    // the tabs fill the content box rather than the full 3rem of the strip, otherwise they overflow the
    // strip's border by its width and the slider of the right-side strip gets clipped
    & :deep(.v-btn) {
        min-width: 100%;
        width: 100%;
        padding: 0 0 0 1rem !important;

        &:after {
            width: 100%;
        }
    }
}
</style>
