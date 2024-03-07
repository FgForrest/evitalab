<script setup lang="ts">
import { AttributeSchemaUnion } from '@/model/evitadb'
import { EditorService, useEditorService } from '@/services/editor/editor.service'
import { UnexpectedError } from '@/model/lab'
import LabEditorSchemaViewerContainerSectionListItem
    from '@/components/lab/editor/schema-viewer/LabEditorSchemaViewerContainerSectionListItem.vue'
import { LabService, useLabService } from '@/services/lab.service'
import { SchemaViewerDataPointer } from '@/model/editor/tab/schemaViewer/SchemaViewerDataPointer'
import { CatalogSchemaPointer } from '@/model/editor/tab/schemaViewer/CatalogSchemaPointer'
import { SchemaViewerRequest } from '@/model/editor/tab/schemaViewer/SchemaViewerRequest'
import { CatalogAttributeSchemaPointer } from '@/model/editor/tab/schemaViewer/CatalogAttributeSchemaPointer'
import { EntitySchemaPointer } from '@/model/editor/tab/schemaViewer/EntitySchemaPointer'
import { EntityAttributeSchemaPointer } from '@/model/editor/tab/schemaViewer/EntityAttributeSchemaPointer'
import { ReferenceSchemaPointer } from '@/model/editor/tab/schemaViewer/ReferenceSchemaPointer'
import { ReferenceAttributeSchemaPointer } from '@/model/editor/tab/schemaViewer/ReferenceAttributeSchemaPointer'

const labService: LabService = useLabService()
const editorService: EditorService = useEditorService()

const props = defineProps<{
    dataPointer: SchemaViewerDataPointer,
    schema: AttributeSchemaUnion
}>()

const flags: string[] = labService.getAttributeSchemaFlags(props.schema)

function openAttributeSchema(): void {
    const parentSchemaPointer = props.dataPointer.schemaPointer
    if (parentSchemaPointer instanceof CatalogSchemaPointer) {
        editorService.createTab(SchemaViewerRequest.createNew(
            props.dataPointer.connection,
            new CatalogAttributeSchemaPointer(
                parentSchemaPointer.catalogName,
                props.schema.name
            )
        ))
    } else if (parentSchemaPointer instanceof EntitySchemaPointer) {
        editorService.createTab(SchemaViewerRequest.createNew(
            props.dataPointer.connection,
            new EntityAttributeSchemaPointer(
                parentSchemaPointer.catalogName,
                parentSchemaPointer.entityType,
                props.schema.name
            )
        ))
    } else if (parentSchemaPointer instanceof ReferenceSchemaPointer) {
        editorService.createTab(SchemaViewerRequest.createNew(
            props.dataPointer.connection,
            new ReferenceAttributeSchemaPointer(
                parentSchemaPointer.catalogName,
                parentSchemaPointer.entityType,
                parentSchemaPointer.referenceName,
                props.schema.name
            )
        ))
    } else {
        throw new UnexpectedError(props.dataPointer.connection, 'Unsupported parent schema for attributes.')
    }
}
</script>

<template>
    <LabEditorSchemaViewerContainerSectionListItem
        :name="schema.name"
        :deprecated="!!schema.deprecationNotice"
        :flags="flags"
        @open="openAttributeSchema"
    />
</template>

<style lang="scss" scoped>

</style>
