<script setup lang="ts">
import { SchemaViewerDataPointer } from '@/model/editor/schema-viewer'
import { ref } from 'vue'
import LabEditorViewerNameVariants from './LabEditorSchemaViewerNameVariants.vue'
import LabEditorViewerAttributes from './LabEditorSchemaViewerAttributes.vue'
import LabEditorViewerContainer from './LabEditorSchemaViewerContainer.vue'
import LabEditorSchemaViewerEntities from './LabEditorSchemaViewerEntities.vue'
import { CatalogSchema } from '@/model/evitadb'

const props = defineProps<{
    dataPointer: SchemaViewerDataPointer,
    schema: CatalogSchema
}>()

const baseProperties = ref<[string, any, ((item?: string) => void)?][]>([
    // todo lho i18n
    ['Version', props.schema.version],
    ['Description', props.schema.description]
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
