<script setup lang="ts">
/**
 * A single selectable entity associated data property item that will be then fetched into grid.
 */

import {
    EntityPropertyDescriptor, gridPropsKey
} from '@/model/editor/tab/dataGrid/data-grid'
import { LabService, useLabService } from '@/services/lab.service'
import LabEditorDataGridPropertyListItem from './LabEditorDataGridPropertySelectorSectionItem.vue'
import { EditorService, useEditorService } from '@/services/editor/editor.service'
import { SchemaViewerRequest } from '@/model/editor/tab/schemaViewer/SchemaViewerRequest'
import { mandatoryInject } from '@/helpers/reactivity'
import { AssociatedDataSchemaPointer } from '@/model/editor/tab/schemaViewer/AssociatedDataSchemaPointer'

const labService: LabService = useLabService()
const editorService: EditorService = useEditorService()

const props = defineProps<{
    propertyDescriptor: EntityPropertyDescriptor
}>()
const emit = defineEmits<{
    (e: 'schemaOpen'): void
}>()
const gridProps = mandatoryInject(gridPropsKey)

const flags: string[] = labService.getAssociatedDataSchemaFlags(props.propertyDescriptor.schema)

function openSchema(): void {
    editorService.createTab(
        SchemaViewerRequest.createNew(
            gridProps.params.dataPointer.connection,
            new AssociatedDataSchemaPointer(
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
