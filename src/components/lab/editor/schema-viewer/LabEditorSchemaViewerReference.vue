<script setup lang="ts">
import LabEditorViewerNameVariants from './LabEditorSchemaViewerNameVariants.vue'
import LabEditorViewerContainer from './LabEditorSchemaViewerContainer.vue'
import LabEditorSchemaViewerAttributes from './LabEditorSchemaViewerAttributes.vue'
import { EditorService, useEditorService } from '@/services/editor/editor.service'
import { ReferenceSchema } from '@/model/evitadb'
import { KeywordValue, Property, PropertyValue } from '@/model/properties-table'
import { SchemaViewerDataPointer } from '@/model/editor/tab/schemaViewer/SchemaViewerDataPointer'
import { SchemaViewerRequest } from '@/model/editor/tab/schemaViewer/SchemaViewerRequest'
import { EntitySchemaPointer } from '@/model/editor/tab/schemaViewer/EntitySchemaPointer'

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
                editorService.createTab(SchemaViewerRequest.createNew(
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
                editorService.createTab(SchemaViewerRequest.createNew(
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
