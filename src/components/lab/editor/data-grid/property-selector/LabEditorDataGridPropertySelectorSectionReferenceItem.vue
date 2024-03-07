<script setup lang="ts">
/**
 * A single selectable entity reference property item that will be then fetched into grid.
 */

import { LabService, useLabService } from '@/services/lab.service'
import LabEditorDataGridPropertyListItem from './LabEditorDataGridPropertySelectorSectionItem.vue'
import { EditorService, useEditorService } from '@/services/editor/editor.service'
import { mandatoryInject } from '@/helpers/reactivity'
import { EntityPropertyDescriptor, EntityPropertyKey, gridPropsKey } from '@/model/editor/tab/dataGrid/data-grid'
import { SchemaViewerRequest } from '@/model/editor/tab/schemaViewer/SchemaViewerRequest'
import { ReferenceSchemaPointer } from '@/model/editor/tab/schemaViewer/ReferenceSchemaPointer'

const labService: LabService = useLabService()
const editorService: EditorService = useEditorService()

const props = withDefaults(defineProps<{
    propertyDescriptor: EntityPropertyDescriptor,
    groupParent?: boolean
}>(), {
    groupParent: false
})
const emit = defineEmits<{
    (e: 'toggle', value: { key: EntityPropertyKey, selected: boolean }): void
    (e: 'schemaOpen'): void
}>()
const gridProps = mandatoryInject(gridPropsKey)

const flags: string[] = labService.getReferenceSchemaFlags(props.propertyDescriptor.schema)

function openSchema(): void {
    editorService.createTab(
        SchemaViewerRequest.createNew(
            gridProps.params.dataPointer.connection,
            new ReferenceSchemaPointer(
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
        :group-parent="groupParent"
        @toggle="emit('toggle', $event)"
        @schema-open="openSchema"
    />
</template>

<style lang="scss" scoped>

</style>
