<script setup lang="ts">
/**
 * A single selectable entity body property item that will be then fetched into grid.
 */

import {
    EntityPropertyDescriptor, gridParamsKey
} from '@/model/editor/data-grid'
import LabEditorDataGridPropertySelectorSectionItem from './LabEditorDataGridPropertySelectorSectionItem.vue'
import { EditorService, useEditorService } from '@/services/editor/editor.service'
import { SchemaViewerRequest } from '@/model/editor/schema-viewer-request'
import { EntitySchemaPointer } from '@/model/editor/schema-viewer'
import { mandatoryInject } from '@/helpers/reactivity'

const editorService: EditorService = useEditorService()

const props = defineProps<{
    propertyDescriptor: EntityPropertyDescriptor
}>()
const emit = defineEmits<{
    (e: 'schemaOpen'): void
}>()
const gridParams = mandatoryInject(gridParamsKey)

function openSchema(): void {
    editorService.createTabRequest(
        SchemaViewerRequest.createNew(
            gridParams.dataPointer.connection,
            new EntitySchemaPointer(
                gridParams.dataPointer.catalogName,
                gridParams.dataPointer.entityType
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
