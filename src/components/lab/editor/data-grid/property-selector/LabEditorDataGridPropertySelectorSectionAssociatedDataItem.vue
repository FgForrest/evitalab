<script setup lang="ts">
/**
 * A single selectable entity associated data property item that will be then fetched into grid.
 */

import {
    EntityPropertyDescriptor, gridParamsKey
} from '@/model/editor/data-grid'
import { LabService, useLabService } from '@/services/lab.service'
import LabEditorDataGridPropertyListItem from './LabEditorDataGridPropertySelectorSectionItem.vue'
import { EditorService, useEditorService } from '@/services/editor/editor.service'
import { SchemaViewerRequest } from '@/model/editor/schema-viewer-request'
import { AssociatedDataSchemaPointer } from '@/model/editor/schema-viewer'
import { mandatoryInject } from '@/helpers/reactivity'

const labService: LabService = useLabService()
const editorService: EditorService = useEditorService()

const props = defineProps<{
    propertyDescriptor: EntityPropertyDescriptor
}>()
const emit = defineEmits<{
    (e: 'schemaOpen'): void
}>()
const gridParams = mandatoryInject(gridParamsKey)

const flags: string[] = labService.getAssociatedDataSchemaFlags(props.propertyDescriptor.schema)

function openSchema(): void {
    editorService.createTabRequest(
        SchemaViewerRequest.createNew(
            gridParams.dataPointer.connection,
            new AssociatedDataSchemaPointer(
                gridParams.dataPointer.catalogName,
                gridParams.dataPointer.entityType,
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
