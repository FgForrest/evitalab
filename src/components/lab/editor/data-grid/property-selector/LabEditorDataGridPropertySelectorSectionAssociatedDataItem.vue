<script setup lang="ts">

import {
    DataGridConsoleData,
    DataGridConsoleParams,
    EntityPropertyDescriptor
} from '@/model/editor/data-grid'
import { LabService, useLabService } from '@/services/lab.service'
import LabEditorDataGridPropertyListItem from './LabEditorDataGridPropertySelectorSectionItem.vue'
import { EditorService, useEditorService } from '@/services/editor/editor.service'
import { SchemaViewerRequest } from '@/model/editor/schema-viewer-request'
import { AssociatedDataSchemaPointer } from '@/model/editor/schema-viewer'
import { TabComponentProps } from '@/model/editor/editor'

const labService: LabService = useLabService()
const editorService: EditorService = useEditorService()

const props = defineProps<{
    gridProps: TabComponentProps<DataGridConsoleParams, DataGridConsoleData>,
    propertyDescriptor: EntityPropertyDescriptor
}>()
const emit = defineEmits<{
    (e: 'schemaOpen'): void
}>()

const flags: string[] = labService.getAssociatedDataSchemaFlags(props.propertyDescriptor.schema)

function openSchema(): void {
    editorService.createTabRequest(
        new SchemaViewerRequest(
            props.gridProps.params.dataPointer.connection,
            new AssociatedDataSchemaPointer(
                props.gridProps.params.dataPointer.catalogName,
                props.gridProps.params.dataPointer.entityType,
                props.propertyDescriptor.schema.name
            )
        )
    )
    emit('schemaOpen')
}
</script>

<template>
    <LabEditorDataGridPropertyListItem
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
