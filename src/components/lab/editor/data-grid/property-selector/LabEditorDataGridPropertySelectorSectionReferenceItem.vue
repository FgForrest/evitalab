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
import { ReferenceSchemaPointer } from '@/model/editor/schema-viewer'
import { TabComponentProps } from '@/model/editor/editor'

const labService: LabService = useLabService()
const editorService: EditorService = useEditorService()

const props = withDefaults(defineProps<{
    gridProps: TabComponentProps<DataGridConsoleParams, DataGridConsoleData>,
    propertyDescriptor: EntityPropertyDescriptor,
    groupParent?: boolean
}>(), {
    groupParent: false
})
const emit = defineEmits<{
    (e: 'toggle', value: { key: EntityPropertyKey, selected: boolean }): void
    (e: 'schemaOpen'): void
}>()

const flags: string[] = labService.getReferenceSchemaFlags(props.propertyDescriptor.schema)

function openSchema(): void {
    editorService.createTabRequest(
        new SchemaViewerRequest(
            props.gridProps.params.dataPointer.connection,
            new ReferenceSchemaPointer(
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
        :group-parent="groupParent"
        @toggle="emit('toggle', $event)"
        @schema-open="openSchema"
    />
</template>

<style lang="scss" scoped>

</style>
