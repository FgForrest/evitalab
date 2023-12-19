<script setup lang="ts">

import {
    DataGridConsoleData,
    DataGridConsoleParams,
    EntityPropertyDescriptor, EntityPropertyKey
} from '@/model/editor/data-grid'
import { LabService, useLabService } from '@/services/lab.service'
import LabEditorDataGridPropertyListItem from './LabEditorDataGridPropertySelectorSectionItem.vue'
import { EditorService, useEditorService } from '@/services/editor/editor.service'
import { SchemaViewerRequest } from '@/model/editor/schema-viewer-request'
import { ReferenceAttributeSchemaPointer } from '@/model/editor/schema-viewer'
import { TabComponentProps } from '@/model/editor/editor'

const labService: LabService = useLabService()
const editorService: EditorService = useEditorService()

const props = defineProps<{
    gridProps: TabComponentProps<DataGridConsoleParams, DataGridConsoleData>,
    referencePropertyDescriptor: EntityPropertyDescriptor,
    attributePropertyDescriptor: EntityPropertyDescriptor
}>()
const emit = defineEmits<{
    (e: 'toggle', value: { key: EntityPropertyKey, selected: boolean }): void
    (e: 'schemaOpen'): void
}>()

const flags: string[] = labService.getAttributeSchemaFlags(props.attributePropertyDescriptor.schema)

function openSchema(): void {
    editorService.createTabRequest(
        new SchemaViewerRequest(
            props.gridProps.params.dataPointer.connection,
            new ReferenceAttributeSchemaPointer(
                props.gridProps.params.dataPointer.catalogName,
                props.gridProps.params.dataPointer.entityType,
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
