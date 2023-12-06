<script setup lang="ts">
import LabEditorSchemaViewerContainerSection from './LabEditorSchemaViewerContainerSection.vue'
import { NameVariants } from '@/model/evitadb'
import VPropertiesTable from '@/components/base/VPropertiesTable.vue'
import { Property, PropertyValue } from '@/model/properties-table'

const props = withDefaults(defineProps<{
    prefix?: string,
    nameVariants: NameVariants
}>(), {
    prefix: ''
})

const name = props.prefix ? `${props.prefix} name variants` : 'Name variants'

const properties: Property[] = [
    { name: 'camelCase', value: new PropertyValue(props.nameVariants.camelCase) },
    { name: 'kebab-case', value: new PropertyValue(props.nameVariants.kebabCase) },
    { name: 'PascalCase', value: new PropertyValue(props.nameVariants.pascalCase) },
    { name: 'snake_case', value: new PropertyValue(props.nameVariants.snakeCase) },
    { name: 'UPPER_CASE', value: new PropertyValue(props.nameVariants.upperSnakeCase) }
]
</script>

<template>
    <LabEditorSchemaViewerContainerSection :name="name">
        <VPropertiesTable :properties="properties"/>
    </LabEditorSchemaViewerContainerSection>
</template>

<style lang="scss" scoped>

</style>
