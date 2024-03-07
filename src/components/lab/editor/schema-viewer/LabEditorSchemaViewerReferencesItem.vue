<script setup lang="ts">
import { ReferenceSchema } from '@/model/evitadb'
import { UnexpectedError } from '@/model/lab'
import { EditorService, useEditorService } from '@/services/editor/editor.service'
import LabEditorSchemaViewerContainerSectionListItem
    from '@/components/lab/editor/schema-viewer/LabEditorSchemaViewerContainerSectionListItem.vue'
import { LabService, useLabService } from '@/services/lab.service'
import { SchemaViewerDataPointer } from '@/model/editor/tab/schemaViewer/SchemaViewerDataPointer'
import { EntitySchemaPointer } from '@/model/editor/tab/schemaViewer/EntitySchemaPointer'
import { SchemaViewerRequest } from '@/model/editor/tab/schemaViewer/SchemaViewerRequest'
import { ReferenceSchemaPointer } from '@/model/editor/tab/schemaViewer/ReferenceSchemaPointer'

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
    editorService.createTab(SchemaViewerRequest.createNew(
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
