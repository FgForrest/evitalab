<script setup lang="ts">
import { EditorService, useEditorService } from '@/services/editor/editor.service'
import { EntitySchema } from '@/model/evitadb'
import { UnexpectedError } from '@/model/lab'
import LabEditorSchemaViewerContainerSectionListItem
    from '@/components/lab/editor/schema-viewer/LabEditorSchemaViewerContainerSectionListItem.vue'
import { LabService, useLabService } from '@/services/lab.service'
import { SchemaViewerDataPointer } from '@/model/editor/tab/schemaViewer/SchemaViewerDataPointer'
import { CatalogSchemaPointer } from '@/model/editor/tab/schemaViewer/CatalogSchemaPointer'
import { SchemaViewerRequest } from '@/model/editor/tab/schemaViewer/SchemaViewerRequest'
import { EntitySchemaPointer } from '@/model/editor/tab/schemaViewer/EntitySchemaPointer'

const labService: LabService = useLabService()
const editorService: EditorService = useEditorService()

const props = defineProps<{
    dataPointer: SchemaViewerDataPointer,
    schema: EntitySchema
}>()

const flags: string[] = labService.getEntitySchemaFlags(props.schema)

function openEntitySchema(): void {
    if (!(props.dataPointer.schemaPointer instanceof CatalogSchemaPointer)) {
        throw new UnexpectedError(props.dataPointer.connection, 'Unsupported parent schema for entities.')
    }
    editorService.createTab(SchemaViewerRequest.createNew(
        props.dataPointer.connection,
        new EntitySchemaPointer(
            props.dataPointer.schemaPointer.catalogName,
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
        @open="openEntitySchema"
    />
</template>

<style lang="scss" scoped>

</style>
