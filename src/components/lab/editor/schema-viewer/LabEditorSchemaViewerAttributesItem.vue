<script setup lang="ts">
import {
    CatalogAttributeSchemaPointer,
    CatalogSchemaPointer,
    EntityAttributeSchemaPointer,
    EntitySchemaPointer,
    ReferenceAttributeSchemaPointer,
    ReferenceSchemaPointer,
    SchemaViewerDataPointer
} from '@/model/editor/schema-viewer'
import { AttributeSchemaUnion, GlobalAttributeSchema } from '@/model/evitadb'
import { EditorService, useEditorService } from '@/services/editor/editor.service'
import { SchemaViewerRequest } from '@/model/editor/schema-viewer-request'
import { UnexpectedError } from '@/model/lab'
import LabEditorSchemaViewerContainerSectionListItem
    from '@/components/lab/editor/schema-viewer/LabEditorSchemaViewerContainerSectionListItem.vue'

const editorService: EditorService = useEditorService()

const props = defineProps<{
    dataPointer: SchemaViewerDataPointer,
    schema: AttributeSchemaUnion
}>()

const globalAttribute = 'uniqueGlobally' in props.schema

const flags: string[] = []
if (globalAttribute && (props.schema as GlobalAttributeSchema).uniqueGlobally) {
    flags.push('unique globally')
} else if (props.schema.unique) {
    flags.push('unique')
}
if (props.schema.unique || props.schema.filterable) flags.push('filterable')
if (props.schema.sortable) flags.push('sortable')
if (props.schema.localized) flags.push('localized')

function openAttributeSchema(): void {
    const parentSchemaPointer = props.dataPointer.schemaPointer
    if (parentSchemaPointer instanceof CatalogSchemaPointer) {
        editorService.createTabRequest(new SchemaViewerRequest(
            props.dataPointer.connection,
            new CatalogAttributeSchemaPointer(
                parentSchemaPointer.catalogName,
                props.schema.name
            )
        ))
    } else if (parentSchemaPointer instanceof EntitySchemaPointer) {
        editorService.createTabRequest(new SchemaViewerRequest(
            props.dataPointer.connection,
            new EntityAttributeSchemaPointer(
                parentSchemaPointer.catalogName,
                parentSchemaPointer.entityType,
                props.schema.name
            )
        ))
    } else if (parentSchemaPointer instanceof ReferenceSchemaPointer) {
        editorService.createTabRequest(new SchemaViewerRequest(
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
