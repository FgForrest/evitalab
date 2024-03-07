<script setup lang="ts">
/**
 * A single selectable entity attribute property item that will be then fetched into grid.
 */

import { LabService, useLabService } from '@/services/lab.service'
import LabEditorDataGridPropertySelectorSectionItem from './LabEditorDataGridPropertySelectorSectionItem.vue'
import { EditorService, useEditorService } from '@/services/editor/editor.service'
import { mandatoryInject } from '@/helpers/reactivity'
import { EntityPropertyDescriptor, gridPropsKey } from '@/model/editor/tab/dataGrid/data-grid'
import { SchemaViewerRequest } from '@/model/editor/tab/schemaViewer/SchemaViewerRequest'
import { EntityAttributeSchemaPointer } from '@/model/editor/tab/schemaViewer/EntityAttributeSchemaPointer'

const labService: LabService = useLabService()
const editorService: EditorService = useEditorService()

const props = defineProps<{
    propertyDescriptor: EntityPropertyDescriptor
}>()
const emit = defineEmits<{
    (e: 'schemaOpen'): void
}>()
const gridProps = mandatoryInject(gridPropsKey)

const flags: string[] = labService.getAttributeSchemaFlags(props.propertyDescriptor.schema)

function openSchema(): void {
    editorService.createTab(
        SchemaViewerRequest.createNew(
            gridProps.params.dataPointer.connection,
            new EntityAttributeSchemaPointer(
                gridProps.params.dataPointer.catalogName,
                gridProps.params.dataPointer.entityType,
                props.propertyDescriptor.schema.name
            )
        )
    )
    emit('schemaOpen')
}
</script>

<template>
    <LabEditorDataGridPropertySelectorSectionItem
        :value="propertyDescriptor.key"
        :title="propertyDescriptor.title"
        :description="propertyDescriptor.schema?.description"
        :flags="flags"
        openable
        @schema-open="openSchema"
    />
</template>

<style lang="scss" scoped>

</style>
