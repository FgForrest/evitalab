<script setup lang="ts">
import { CatalogSchemaPointer, EntitySchemaPointer, SchemaViewerDataPointer } from '@/model/editor/schema-viewer'
import { EditorService, useEditorService } from '@/services/editor/editor.service'
import { SchemaViewerRequest } from '@/model/editor/schema-viewer-request'
import { EntitySchema } from '@/model/evitadb'
import { UnexpectedError } from '@/model/lab'
import LabEditorSchemaViewerContainerSectionListItem
    from '@/components/lab/editor/schema-viewer/LabEditorSchemaViewerContainerSectionListItem.vue'
import { LabService, useLabService } from '@/services/lab.service'

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
    editorService.createTabRequest(SchemaViewerRequest.createNew(
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
