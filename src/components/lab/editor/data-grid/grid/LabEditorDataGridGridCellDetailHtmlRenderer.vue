<script setup lang="ts">
/**
 * Entity property value renderer that tries to render the value as HTML.
 */

import LabEditorDataGridGridCellDetailValueRenderer
    from '@/components/lab/editor/data-grid/grid/LabEditorDataGridGridCellDetailValueRenderer.vue'
import { computed } from 'vue'
import DOMPurify from 'dompurify'
import { EntityPropertyValue } from '@/model/editor/tab/dataGrid/data-grid'

const props = withDefaults(defineProps<{
    value: EntityPropertyValue | EntityPropertyValue[],
    fillSpace?: boolean
}>(), {
    fillSpace: true
})

const formattedValue = computed<string>(() => {
    if (props.value instanceof Array || typeof (props.value as EntityPropertyValue).value() !== 'string') {
        return 'Error: Failed to render HTML. Value is not a string.'
    }
    return DOMPurify.sanitize((props.value as EntityPropertyValue).toPreviewString())
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
