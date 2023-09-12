<script setup lang="ts">
import LabEditorSchemaViewerContainerSection from './LabEditorSchemaViewerContainerSection.vue'
import { NameVariants } from '@/model/evitadb'
import VPropertiesTable from '@/components/base/VPropertiesTable.vue'

const props = withDefaults(defineProps<{
    prefix?: string,
    nameVariants: NameVariants
}>(), {
    prefix: ''
})

const name = props.prefix ? `${props.prefix} name variants` : 'Name variants'

const properties: [string, any, ((item?: string) => void)?][] = [
    ['camelCase', props.nameVariants.camelCase as String],
    ['kebab-case', props.nameVariants.kebabCase as String],
    ['PascalCase', props.nameVariants.pascalCase as String],
    ['snake_case', props.nameVariants.snakeCase as String],
    ['UPPER_CASE', props.nameVariants.upperSnakeCase as String]
]
</script>

<template>
    <LabEditorSchemaViewerContainerSection :name="name">
        <VPropertiesTable :properties="properties"/>
    </LabEditorSchemaViewerContainerSection>
</template>

<style lang="scss" scoped>

</style>
