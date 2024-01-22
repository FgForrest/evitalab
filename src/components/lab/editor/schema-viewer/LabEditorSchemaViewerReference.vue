<script setup lang="ts">
import LabEditorViewerNameVariants from './LabEditorSchemaViewerNameVariants.vue'
import LabEditorViewerContainer from './LabEditorSchemaViewerContainer.vue'
import { EntitySchemaPointer, SchemaViewerDataPointer } from '@/model/editor/schema-viewer'
import LabEditorSchemaViewerAttributes from './LabEditorSchemaViewerAttributes.vue'
import { EditorService, useEditorService } from '@/services/editor/editor.service'
import { SchemaViewerRequest } from '@/model/editor/schema-viewer-request'
import { ReferenceSchema } from '@/model/evitadb'
import { KeywordValue, Property, PropertyValue } from '@/model/properties-table'

const editorService: EditorService = useEditorService()

const props = defineProps<{
    dataPointer: SchemaViewerDataPointer,
    schema: ReferenceSchema
}>()

const properties: Property[] = []
properties.push({ name: 'Description', value: new PropertyValue(props.schema.description) })
properties.push({ name: 'Deprecation notice', value: new PropertyValue(props.schema.deprecationNotice) })
properties.push({ name: 'Cardinality', value: new PropertyValue(new KeywordValue(props.schema.cardinality)) })
if (props.schema.referencedEntityTypeManaged) {
    properties.push({
        name: 'Referenced entity',
        value: new PropertyValue(
            new KeywordValue(props.schema.referencedEntityType),
            undefined,
            item => {
                editorService.createTabRequest(SchemaViewerRequest.createNew(
                    props.dataPointer.connection,
                    new EntitySchemaPointer(
                        props.dataPointer.schemaPointer.catalogName,
                        props.schema.referencedEntityType
                    )
                ))
            }
        ),
    })
} else {
    properties.push({
        name: 'Referenced entity',
        value: new PropertyValue(new KeywordValue(props.schema.referencedEntityType))
    })
}
properties.push({ name: 'Referenced entity managed', value: new PropertyValue(props.schema.referencedEntityTypeManaged) })
if (props.schema.referencedGroupType == undefined) {
    properties.push({ name: 'Referenced group', value: new PropertyValue(undefined) })
} else if (props.schema.referencedGroupTypeManaged) {
    properties.push({
        name: 'Referenced group',
        value: new PropertyValue(
            props.schema.referencedGroupType ? new KeywordValue(props.schema.referencedGroupType) : undefined,
            undefined,
            item => {
                editorService.createTabRequest(SchemaViewerRequest.createNew(
                    props.dataPointer.connection,
                    new EntitySchemaPointer(
                        props.dataPointer.schemaPointer.catalogName,
                        props.schema.referencedGroupType as string
                    )
                ))
            }
        )
    })
} else {
    properties.push({
        name: 'Referenced group',
        value: new PropertyValue(props.schema.referencedGroupType ? new KeywordValue(props.schema.referencedGroupType) : undefined)
    })
}
properties.push({ name: 'Referenced group managed', value: new PropertyValue(props.schema.referencedGroupTypeManaged) })
properties.push({ name: 'Indexed', value: new PropertyValue(props.schema.indexed) })
properties.push({ name: 'Faceted', value: new PropertyValue(props.schema.faceted) })

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
