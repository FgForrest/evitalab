<script setup lang="ts">
import {
    AssociatedDataSchemaPointer,
    EntitySchemaPointer,
    SchemaViewerDataPointer
} from '@/model/editor/schema-viewer'
import { AssociatedDataSchema } from '@/model/evitadb'
import { EditorService, useEditorService } from '@/services/editor/editor.service'
import { SchemaViewerRequest } from '@/model/editor/schema-viewer-request'
import { UnexpectedError } from '@/model/lab'
import LabEditorSchemaViewerContainerSectionListItem
    from '@/components/lab/editor/schema-viewer/LabEditorSchemaViewerContainerSectionListItem.vue'
import { LabService, useLabService } from '@/services/lab.service'

const labService: LabService = useLabService()
const editorService: EditorService = useEditorService()

const props = defineProps<{
    dataPointer: SchemaViewerDataPointer,
    schema: AssociatedDataSchema
}>()

const flags: string[] = labService.getAssociatedDataSchemaFlags(props.schema)

function openAssociatedDataSchema(): void {
    if (!(props.dataPointer.schemaPointer instanceof EntitySchemaPointer)) {
        throw new UnexpectedError(props.dataPointer.connection, 'Unsupported parent schema for entities.')
    }
    editorService.createTabRequest(SchemaViewerRequest.createNew(
        props.dataPointer.connection,
        new AssociatedDataSchemaPointer(
            props.dataPointer.schemaPointer.catalogName,
            props.dataPointer.schemaPointer.entityType,
            props.schema.name
        )
    ))
}
</script>

<template>
    <LabEditorSchemaViewerContainerSectionListItem
        :name="schema.name"
        :deprecated="!!schema.deprecationNotice"
        :flags="flags"
        @open="openAssociatedDataSchema"
    />
</template>

<style lang="scss" scoped>

</style>
