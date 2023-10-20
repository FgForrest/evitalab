<script setup lang="ts">
import {
    EntityPropertyValueDesiredOutputFormat,
    EntityPropertyValueSupportedCodeLanguage
} from '@/model/editor/data-grid'
import { Scalar } from '@/model/evitadb'
import LabEditorDataGridGridCellDetailAutoPrettyPrintRenderer
    from '@/components/lab/editor/data-grid/grid/LabEditorDataGridGridCellDetailAutoPrettyPrintRenderer.vue'
import LabEditorDataGridGridCellDetailCodeRenderer
    from '@/components/lab/editor/data-grid/grid/LabEditorDataGridGridCellDetailCodeRenderer.vue'
import LabEditorDataGridGridCellDetailMarkdownRenderer
    from '@/components/lab/editor/data-grid/grid/LabEditorDataGridGridCellDetailMarkdownRenderer.vue'
import LabEditorDataGridGridCellDetailHtmlRenderer
    from '@/components/lab/editor/data-grid/grid/LabEditorDataGridGridCellDetailHtmlRenderer.vue'

const props = withDefaults(defineProps<{
    dataType?: Scalar | undefined,
    value: any,
    outputFormat?: EntityPropertyValueDesiredOutputFormat,
    fillSpace?: boolean
}>(), {
    outputFormat: EntityPropertyValueDesiredOutputFormat.AutoPrettyPrint,
    fillSpace: true
})
</script>

<template>
    <LabEditorDataGridGridCellDetailAutoPrettyPrintRenderer
        v-if="outputFormat === EntityPropertyValueDesiredOutputFormat.AutoPrettyPrint"
        :data-type="dataType"
        :value="value"
        :fill-space="fillSpace"
    />
    <LabEditorDataGridGridCellDetailMarkdownRenderer
        v-else-if="outputFormat === EntityPropertyValueDesiredOutputFormat.Markdown"
        :value="value"
        :data-type="dataType"
        :fill-space="fillSpace"
    />
    <LabEditorDataGridGridCellDetailCodeRenderer
        v-else-if="outputFormat === EntityPropertyValueDesiredOutputFormat.Raw"
        :value="value"
        :fill-space="fillSpace"
    />
    <LabEditorDataGridGridCellDetailCodeRenderer
        v-else-if="outputFormat === EntityPropertyValueDesiredOutputFormat.Json"
        :value="value"
        :code-language="EntityPropertyValueSupportedCodeLanguage.Json"
        :fill-space="fillSpace"
    />
    <LabEditorDataGridGridCellDetailCodeRenderer
        v-else-if="outputFormat === EntityPropertyValueDesiredOutputFormat.Xml"
        :value="value"
        :code-language="EntityPropertyValueSupportedCodeLanguage.Xml"
        :fill-space="fillSpace"
    />
    <LabEditorDataGridGridCellDetailHtmlRenderer
        v-else-if="outputFormat === EntityPropertyValueDesiredOutputFormat.Html"
        :value="value"
        :fill-space="fillSpace"
    />
</template>

<style lang="scss" scoped>

</style>
