<script setup lang="ts">
import { SchemaViewerDataPointer } from '@/model/editor/schema-viewer'
import { ref } from 'vue'
import LabEditorViewerNameVariants from './LabEditorSchemaViewerNameVariants.vue'
import LabEditorViewerAttributes from './LabEditorSchemaViewerAttributes.vue'
import LabEditorViewerContainer from './LabEditorSchemaViewerContainer.vue'
import LabEditorSchemaViewerAssociatedData from './LabEditorSchemaViewerAssociatedData.vue'
import LabEditorSchemaViewerReferences from './LabEditorSchemaViewerReferences.vue'
import { EntitySchema } from '@/model/evitadb'

const props = defineProps<{
    dataPointer: SchemaViewerDataPointer,
    schema: EntitySchema
}>()

const baseProperties = ref<[string, any, ((item?: string) => void)?][]>([
    // todo lho i18n
    ['Version', props.schema.version],
    ['Description', props.schema.description],
    ['Deprecation notice', props.schema.deprecationNotice],
    ['Locales', props.schema.locales],
    ['Currencies', props.schema.currencies],
    ['Generated primary key', props.schema.withGeneratedPrimaryKey],
    ['Hierarchical', props.schema.withHierarchy],
    ['Prices', props.schema.withPrice],
    ['Indexed decimal places', props.schema.indexedPricePlaces],
    ['Evolution modes', props.schema.evolutionMode]
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
