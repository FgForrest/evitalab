<script setup lang="ts">
import LabEditorViewerNameVariants from './LabEditorSchemaViewerNameVariants.vue'
import LabEditorViewerContainer from './LabEditorSchemaViewerContainer.vue'
import { EntitySchemaPointer, SchemaViewerDataPointer } from '@/model/editor/schema-viewer'
import LabEditorSchemaViewerAttributes from './LabEditorSchemaViewerAttributes.vue'
import { EditorService, useEditorService } from '@/services/editor/editor.service'
import { SchemaViewerRequest } from '@/model/editor/schema-viewer-request'
import { ReferenceSchema } from '@/model/evitadb'

const editorService: EditorService = useEditorService()

const props = defineProps<{
    dataPointer: SchemaViewerDataPointer,
    schema: ReferenceSchema
}>()

const properties: [string, any, ((item?: string) => void)?][] = []
properties.push(['Description', props.schema.description])
properties.push(['Deprecation notice', props.schema.deprecationNotice])
properties.push(['Cardinality', [props.schema.cardinality]])
if (props.schema.referencedEntityTypeManaged) {
    properties.push([
        'Referenced entity',
        [props.schema.referencedEntityType],
        item => {
            editorService.createTabRequest(new SchemaViewerRequest(
                props.dataPointer.connection,
                new EntitySchemaPointer(
                    props.dataPointer.schemaPointer.catalogName,
                    props.schema.referencedEntityType
                )
            ))
        }
    ])
} else {
    properties.push([
        'Referenced entity',
        [props.schema.referencedEntityType]
    ])
}
properties.push(['Referenced entity managed', props.schema.referencedEntityTypeManaged])
if (props.schema.referencedGroupTypeManaged) {
    properties.push([
        'Referenced group',
        props.schema.referencedGroupType ? [props.schema.referencedGroupType] : undefined,
        item => {
            editorService.createTabRequest(new SchemaViewerRequest(
                props.dataPointer.connection,
                new EntitySchemaPointer(
                    props.dataPointer.schemaPointer.catalogName,
                    props.schema.referencedEntityType
                )
            ))
        }
    ])
} else {
    properties.push([
        'Referenced group',
        props.schema.referencedGroupType ? [props.schema.referencedGroupType] : undefined
    ])
}
properties.push(['Referenced group managed', props.schema.referencedGroupTypeManaged])
properties.push(['Indexed', props.schema.indexed])
properties.push(['Faceted', props.schema.faceted])

</script>

<template>
    <LabEditorViewerContainer :properties="properties">
        <template #nested-details>
            <LabEditorViewerNameVariants :name-variants="schema.nameVariants" />

            <LabEditorViewerNameVariants
                prefix="Referenced entity"
                :name-variants="schema.entityTypeNameVariants"
            />

            <LabEditorViewerNameVariants
                v-if="schema.referencedGroupType && schema.groupTypeNameVariants"
                prefix="Referenced group"
                :name-variants="schema.groupTypeNameVariants"
            />

            <LabEditorSchemaViewerAttributes
                v-if="Object.values(schema.attributes) && Object.values(schema.attributes).length > 0"
                :data-pointer="dataPointer"
                :attributes="Object.values(schema.attributes)"
            />
        </template>
    </LabEditorViewerContainer>
</template>

<style lang="scss" scoped>

</style>
