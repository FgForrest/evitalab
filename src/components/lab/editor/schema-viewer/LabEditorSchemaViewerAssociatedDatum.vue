<script setup lang="ts">
import LabEditorViewerNameVariants from './LabEditorSchemaViewerNameVariants.vue'
import LabEditorViewerContainer from './LabEditorSchemaViewerContainer.vue'
import { SchemaViewerDataPointer } from '@/model/editor/schema-viewer'
import { AssociatedDataSchema } from '@/model/evitadb'
import { KeywordValue, Property, PropertyValue } from '@/model/properties-table'

const props = defineProps<{
    dataPointer: SchemaViewerDataPointer,
    schema: AssociatedDataSchema
}>()

const properties: Property[] = [
    { name: 'Type', value: new PropertyValue(new KeywordValue(props.schema.type.replace('ComplexDataObject', 'Object'))) },
    { name: 'Description', value: new PropertyValue(props.schema.description) },
    { name: 'Deprecation notice', value: new PropertyValue(props.schema.deprecationNotice) },
    { name: 'Localized', value: new PropertyValue(props.schema.localized as boolean) },
    { name: 'Nullable', value: new PropertyValue(props.schema.nullable as boolean) }
]

</script>

<template>
    <LabEditorViewerContainer :properties="properties">
        <template #nested-details>
            <LabEditorViewerNameVariants :name-variants="schema.nameVariants" />
        </template>
    </LabEditorViewerContainer>
</template>

<style lang="scss" scoped>

</style>
