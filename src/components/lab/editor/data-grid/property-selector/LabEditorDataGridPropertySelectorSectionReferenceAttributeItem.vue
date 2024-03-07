<script setup lang="ts">
/**
 * A single selectable reference attribute property item that will be then fetched into grid.
 */

import { LabService, useLabService } from '@/services/lab.service'
import LabEditorDataGridPropertyListItem from './LabEditorDataGridPropertySelectorSectionItem.vue'
import { EditorService, useEditorService } from '@/services/editor/editor.service'
import { mandatoryInject } from '@/helpers/reactivity'
import { EntityPropertyDescriptor, EntityPropertyKey, gridPropsKey } from '@/model/editor/tab/dataGrid/data-grid'
import { SchemaViewerRequest } from '@/model/editor/tab/schemaViewer/SchemaViewerRequest'
import { ReferenceAttributeSchemaPointer } from '@/model/editor/tab/schemaViewer/ReferenceAttributeSchemaPointer'

const labService: LabService = useLabService()
const editorService: EditorService = useEditorService()

const props = defineProps<{
    referencePropertyDescriptor: EntityPropertyDescriptor,
    attributePropertyDescriptor: EntityPropertyDescriptor
}>()
const emit = defineEmits<{
    (e: 'toggle', value: { key: EntityPropertyKey, selected: boolean }): void
    (e: 'schemaOpen'): void
}>()
const gridProps = mandatoryInject(gridPropsKey)

const flags: string[] = labService.getAttributeSchemaFlags(props.attributePropertyDescriptor.schema)

function openSchema(): void {
    editorService.createTab(
        SchemaViewerRequest.createNew(
            gridProps.params.dataPointer.connection,
            new ReferenceAttributeSchemaPointer(
                gridProps.params.dataPointer.catalogName,
                gridProps.params.dataPointer.entityType,
                props.referencePropertyDescriptor.schema.name,
                props.attributePropertyDescriptor.schema.name
            )
        )
    )
    emit('schemaOpen')
}
</script>

<template>
    <LabEditorDataGridPropertyListItem
        :value="attributePropertyDescriptor.key"
        :title="attributePropertyDescriptor.title"
        :description="attributePropertyDescriptor.schema?.description"
        :flags="flags"
        openable
        @toggle="emit('toggle', $event)"
        @schema-open="openSchema"
    />
</template>

<style lang="scss" scoped>

</style>
