<script setup lang="ts">
import LabEditorViewerNameVariants from './LabEditorSchemaViewerNameVariants.vue'
import LabEditorViewerContainer from './LabEditorSchemaViewerContainer.vue'
import { AttributeSchemaUnion, EntityAttributeSchema, GlobalAttributeSchema } from '@/model/evitadb'
import { SchemaViewerDataPointer } from '@/model/editor/schema-viewer'

const props = defineProps<{
    dataPointer: SchemaViewerDataPointer,
    schema: AttributeSchemaUnion
}>()

const globalAttribute = 'uniqueGlobally' in props.schema
const entityAttribute = 'representative' in props.schema

const properties: [string, any, ((item?: string) => void)?][] = []
properties.push(['Type', props.schema.type])
properties.push(['Description', props.schema.description])
properties.push(['Deprecation notice', props.schema.deprecationNotice])
if (entityAttribute) properties.push(['Representative', (props.schema as EntityAttributeSchema).representative as boolean])
properties.push(['Unique', props.schema.unique as boolean])
if (globalAttribute) properties.push(['Unique globally', (props.schema as GlobalAttributeSchema).uniqueGlobally as boolean])
properties.push(['Filterable', props.schema.filterable as boolean])
properties.push(['Sortable', props.schema.sortable as boolean])
properties.push(['Localized', props.schema.localized as boolean])
properties.push(['Nullable', props.schema.nullable as boolean])
properties.push(['Default value', props.schema.defaultValue])
properties.push(['Indexed decimal places', props.schema.indexedDecimalPlaces])

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
