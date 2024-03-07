<script setup lang="ts">
/**
 * A single selectable entity body property item that will be then fetched into grid.
 */

import LabEditorDataGridPropertySelectorSectionItem from './LabEditorDataGridPropertySelectorSectionItem.vue'
import { EditorService, useEditorService } from '@/services/editor/editor.service'
import { mandatoryInject } from '@/helpers/reactivity'
import { EntityPropertyDescriptor, gridPropsKey } from '@/model/editor/tab/dataGrid/data-grid'
import { SchemaViewerRequest } from '@/model/editor/tab/schemaViewer/SchemaViewerRequest'
import { EntitySchemaPointer } from '@/model/editor/tab/schemaViewer/EntitySchemaPointer'

const editorService: EditorService = useEditorService()

const props = defineProps<{
    propertyDescriptor: EntityPropertyDescriptor
}>()
const emit = defineEmits<{
    (e: 'schemaOpen'): void
}>()
const gridProps = mandatoryInject(gridPropsKey)

function openSchema(): void {
    editorService.createTab(
        SchemaViewerRequest.createNew(
            gridProps.params.dataPointer.connection,
            new EntitySchemaPointer(
                gridProps.params.dataPointer.catalogName,
                gridProps.params.dataPointer.entityType
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
        openable
        @schema-open="openSchema"
    />
</template>

<style lang="scss" scoped>

</style>
