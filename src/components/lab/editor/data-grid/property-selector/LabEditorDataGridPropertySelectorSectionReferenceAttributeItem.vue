<script setup lang="ts">
/**
 * A single selectable reference attribute property item that will be then fetched into grid.
 */

import {
    EntityPropertyDescriptor, EntityPropertyKey, gridParamsKey
} from '@/model/editor/data-grid'
import { LabService, useLabService } from '@/services/lab.service'
import LabEditorDataGridPropertyListItem from './LabEditorDataGridPropertySelectorSectionItem.vue'
import { EditorService, useEditorService } from '@/services/editor/editor.service'
import { SchemaViewerRequest } from '@/model/editor/schema-viewer-request'
import { ReferenceAttributeSchemaPointer } from '@/model/editor/schema-viewer'
import { mandatoryInject } from '@/helpers/reactivity'

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
const gridParams = mandatoryInject(gridParamsKey)

const flags: string[] = labService.getAttributeSchemaFlags(props.attributePropertyDescriptor.schema)

function openSchema(): void {
    editorService.createTabRequest(
        SchemaViewerRequest.createNew(
            gridParams.dataPointer.connection,
            new ReferenceAttributeSchemaPointer(
                gridParams.dataPointer.catalogName,
                gridParams.dataPointer.entityType,
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
