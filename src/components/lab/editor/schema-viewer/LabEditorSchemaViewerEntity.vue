<script setup lang="ts">
import { SchemaViewerDataPointer } from '@/model/editor/schema-viewer'
import { ref } from 'vue'
import LabEditorViewerNameVariants from './LabEditorSchemaViewerNameVariants.vue'
import LabEditorViewerAttributes from './LabEditorSchemaViewerAttributes.vue'
import LabEditorViewerContainer from './LabEditorSchemaViewerContainer.vue'
import LabEditorSchemaViewerAssociatedData from './LabEditorSchemaViewerAssociatedData.vue'
import LabEditorSchemaViewerReferences from './LabEditorSchemaViewerReferences.vue'
import { EntitySchema } from '@/model/evitadb'
import { KeywordValue, Property, PropertyValue } from '@/model/properties-table'

const props = defineProps<{
    dataPointer: SchemaViewerDataPointer,
    schema: EntitySchema
}>()

const baseProperties = ref<Property[]>([
    // todo lho i18n
    { name: 'Version', value: new PropertyValue(props.schema.version) },
    { name: 'Description', value: new PropertyValue(props.schema.description) },
    { name: 'Deprecation notice', value: new PropertyValue(props.schema.deprecationNotice) },
    { name: 'Locales', value: props.schema.locales.map(locale => new PropertyValue(new KeywordValue(locale))) },
    { name: 'Currencies', value: props.schema.currencies.map(currency => new PropertyValue(new KeywordValue(currency))) },
    { name: 'Generated primary key', value: new PropertyValue(props.schema.withGeneratedPrimaryKey) },
    { name: 'Hierarchical', value: new PropertyValue(props.schema.withHierarchy) },
    { name: 'Prices', value: new PropertyValue(props.schema.withPrice) },
    { name: 'Indexed decimal places', value: new PropertyValue(props.schema.indexedPricePlaces) },
    { name: 'Evolution modes', value: props.schema.evolutionMode.map(mode => new PropertyValue(new KeywordValue(mode))) }
])
</script>

<template>
    <LabEditorViewerContainer :properties="baseProperties">
        <template #nested-details>
            <LabEditorViewerNameVariants :name-variants="schema.nameVariants" />

            <LabEditorViewerAttributes
                v-if="schema.attributes && Object.values(schema.attributes).length > 0"
                :data-pointer="dataPointer"
                :attributes="Object.values(schema.attributes)"
            />

            <LabEditorSchemaViewerAssociatedData
                v-if="schema.associatedData && Object.values(schema.associatedData).length > 0"
                :data-pointer="dataPointer"
                :associated-data="Object.values(schema.associatedData)"
            />

            <LabEditorSchemaViewerReferences
                v-if="schema.references && Object.values(schema.references).length > 0"
                :data-pointer="dataPointer"
                :references="Object.values(schema.references)"
            />
        </template>
    </LabEditorViewerContainer>
</template>

<style lang="scss" scoped>

</style>
