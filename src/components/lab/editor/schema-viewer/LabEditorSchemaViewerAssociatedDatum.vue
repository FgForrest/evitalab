<script setup lang="ts">
import LabEditorViewerNameVariants from './LabEditorSchemaViewerNameVariants.vue'
import LabEditorViewerContainer from './LabEditorSchemaViewerContainer.vue'
import { SchemaViewerDataPointer } from '@/model/editor/schema-viewer'
import { AssociatedDataSchema } from '@/model/evitadb'

const props = defineProps<{
    dataPointer: SchemaViewerDataPointer,
    schema: AssociatedDataSchema
}>()

const properties: [string, any, ((item?: string) => void)?][] = []
properties.push(['Type', props.schema.type.replace('ComplexDataObject', 'Object')])
properties.push(['Description', props.schema.description])
properties.push(['Deprecation notice', props.schema.deprecationNotice])
properties.push(['Localized', props.schema.localized as boolean])
properties.push(['Nullable', props.schema.nullable as boolean])

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
