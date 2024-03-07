<script setup lang="ts">
import { ref } from 'vue'
import LabEditorViewerNameVariants from './LabEditorSchemaViewerNameVariants.vue'
import LabEditorViewerAttributes from './LabEditorSchemaViewerAttributes.vue'
import LabEditorViewerContainer from './LabEditorSchemaViewerContainer.vue'
import { CatalogSchema } from '@/model/evitadb'
import { Property, PropertyValue } from '@/model/properties-table'
import { SchemaViewerDataPointer } from '@/model/editor/tab/schemaViewer/SchemaViewerDataPointer'
import LabEditorSchemaViewerEntities from '@/components/lab/editor/schema-viewer/LabEditorSchemaViewerEntities.vue'

const props = defineProps<{
    dataPointer: SchemaViewerDataPointer,
    schema: CatalogSchema
}>()

const baseProperties = ref<Property[]>([
    // todo lho i18n
    { name: 'Version', value: new PropertyValue(props.schema.version) },
    { name: 'Description', value: new PropertyValue(props.schema.description) }
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

            <LabEditorSchemaViewerEntities
                v-if="schema.entitySchemas && Object.values(schema.entitySchemas).length > 0"
                :data-pointer="dataPointer"
                :entities="Object.values(schema.entitySchemas)"
            />
        </template>
    </LabEditorViewerContainer>
</template>

<style lang="scss" scoped>

</style>
