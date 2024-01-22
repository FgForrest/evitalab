<script setup lang="ts">
/**
 * A single selectable entity reference property item that will be then fetched into grid.
 */

import {
    EntityPropertyDescriptor, EntityPropertyKey, gridParamsKey
} from '@/model/editor/data-grid'
import { LabService, useLabService } from '@/services/lab.service'
import LabEditorDataGridPropertyListItem from './LabEditorDataGridPropertySelectorSectionItem.vue'
import { EditorService, useEditorService } from '@/services/editor/editor.service'
import { SchemaViewerRequest } from '@/model/editor/schema-viewer-request'
import { ReferenceSchemaPointer } from '@/model/editor/schema-viewer'
import { mandatoryInject } from '@/helpers/reactivity'

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
const gridParams = mandatoryInject(gridParamsKey)

const flags: string[] = labService.getReferenceSchemaFlags(props.propertyDescriptor.schema)

function openSchema(): void {
    editorService.createTabRequest(
        SchemaViewerRequest.createNew(
            gridParams.dataPointer.connection,
            new ReferenceSchemaPointer(
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
        :group-parent="groupParent"
        @toggle="emit('toggle', $event)"
        @schema-open="openSchema"
    />
</template>

<style lang="scss" scoped>

</style>
