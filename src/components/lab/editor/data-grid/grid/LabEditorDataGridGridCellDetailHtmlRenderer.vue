<script setup lang="ts">

import LabEditorDataGridGridCellDetailValueRenderer
    from '@/components/lab/editor/data-grid/grid/LabEditorDataGridGridCellDetailValueRenderer.vue'
import { computed } from 'vue'
import DOMPurify from 'dompurify'

const props = withDefaults(defineProps<{
    value: any,
    fillSpace?: boolean
}>(), {
    fillSpace: true
})

const formattedValue = computed<string>(() => {
    if (typeof props.value !== 'string') {
        return 'Error: Failed to render HTML. Value is not a string.'
    }
    return DOMPurify.sanitize(props.value.toString())
})

</script>

<template>
    <LabEditorDataGridGridCellDetailValueRenderer :fill-space="fillSpace">
        <div class="html-renderer">
            <div v-html="formattedValue"/>
        </div>
    </LabEditorDataGridGridCellDetailValueRenderer>
</template>

<style lang="scss" scoped>
.html-renderer {
    padding: 1rem;
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    overflow: auto;
}
</style>
