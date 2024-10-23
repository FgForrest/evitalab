<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Property } from '@/modules/base/model/properties-table/Property'
import { PropertyValue } from '@/modules/base/model/properties-table/PropertyValue'
import { NamingConvention } from '@/modules/connection/model/NamingConvetion'
import { Map } from 'immutable'
import SchemaContainerSection from '@/modules/schema-viewer/viewer/component/SchemaContainerSection.vue'
import VPropertiesTable from '@/modules/base/component/VPropertiesTable.vue'
import { computed } from 'vue'

const { t } = useI18n()

const props = withDefaults(defineProps<{
    prefix?: string,
    nameVariants: Map<NamingConvention, string>
}>(), {
    prefix: ''
})

const name = computed<string>(() =>
    props.prefix
        ? t('schemaViewer.nameVariants.prefixedTitle', { prefix: props.prefix })
        : t('schemaViewer.nameVariants.title'))

const properties = computed<Property[]>(() => [
    new Property(t('schemaViewer.nameVariants.label.camelCase'), new PropertyValue(props.nameVariants.get(NamingConvention.CamelCase))),
    new Property(t('schemaViewer.nameVariants.label.kebabCase'), new PropertyValue(props.nameVariants.get(NamingConvention.KebabCase))),
    new Property(t('schemaViewer.nameVariants.label.pascalCase'), new PropertyValue(props.nameVariants.get(NamingConvention.PascalCase))),
    new Property(t('schemaViewer.nameVariants.label.snakeCase'), new PropertyValue(props.nameVariants.get(NamingConvention.SnakeCase))),
    new Property(t('schemaViewer.nameVariants.label.upperSnakeCase'), new PropertyValue(props.nameVariants.get(NamingConvention.UpperSnakeCase)))
])
</script>

<template>
    <SchemaContainerSection :name="name">
        <VPropertiesTable :properties="properties"/>
    </SchemaContainerSection>
</template>

<style lang="scss" scoped>

</style>
