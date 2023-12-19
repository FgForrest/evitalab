<script setup lang="ts">
/**
 * Render the status bar of a single editor with info like selection, spaces, and so on.
 */

import { EditorState } from '@codemirror/state'
import VStandardCodemirrorStatusBarSelection from '@/components/base/VStandardCodemirrorStatusBarSelection.vue'

const props = defineProps<{
    state?: EditorState
}>()
</script>

<template>
    <VDivider />
    <div v-if="state" class="status-bar">
        <span v-if="state.selection.ranges.length > 1">
            {{ state.selection.ranges.length }} selections
        </span>
        <span v-else-if="state.selection.ranges.length === 1">
            <VStandardCodemirrorStatusBarSelection :doc="state.doc" :selection-range="state.selection.ranges[0]" />
        </span>

        <span class="text-no-wrap">
            {{state.tabSize}} spaces
        </span>
    </div>
</template>

<style lang="scss" scoped>
.status-bar {
    height: 2rem;
    display: flex;
    column-gap: 1rem;
    align-items: center;
    justify-content: right;
    padding: 0 0.5rem;
}
</style>
