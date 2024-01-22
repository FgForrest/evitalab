<script setup lang="ts">
import { EntitySchemaPointer, ReferenceSchemaPointer, SchemaViewerDataPointer } from '@/model/editor/schema-viewer'
import { ReferenceSchema } from '@/model/evitadb'
import { UnexpectedError } from '@/model/lab'
import { EditorService, useEditorService } from '@/services/editor/editor.service'
import { SchemaViewerRequest } from '@/model/editor/schema-viewer-request'
import LabEditorSchemaViewerContainerSectionListItem
    from '@/components/lab/editor/schema-viewer/LabEditorSchemaViewerContainerSectionListItem.vue'
import { LabService, useLabService } from '@/services/lab.service'

const labService: LabService = useLabService()
const editorService: EditorService = useEditorService()

const props = defineProps<{
    dataPointer: SchemaViewerDataPointer,
    schema: ReferenceSchema
}>()

const flags: string[] = labService.getReferenceSchemaFlags(props.schema)

function openReferenceSchema(): void {
    if (!(props.dataPointer.schemaPointer instanceof EntitySchemaPointer)) {
        throw new UnexpectedError(props.dataPointer.connection, 'Unsupported parent schema for entities.')
    }
    editorService.createTabRequest(SchemaViewerRequest.createNew(
        props.dataPointer.connection,
        new ReferenceSchemaPointer(
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
        @open="openReferenceSchema"
    />
</template>

<style lang="scss" scoped>

</style>
