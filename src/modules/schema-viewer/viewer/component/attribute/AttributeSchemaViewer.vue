<script setup lang="ts">

import { useI18n } from 'vue-i18n'
import { SchemaViewerDataPointer } from '@/modules/schema-viewer/viewer/model/SchemaViewerDataPointer'
import { GlobalAttributeSchema } from '@/modules/database-driver/request-response/schema/GlobalAttributeSchema'
import { EntityAttributeSchema } from '@/modules/database-driver/request-response/schema/EntityAttributeSchema'
import { AttributeSchema } from '@/modules/database-driver/request-response/schema/AttributeSchema'
import { Property } from '@/modules/base/model/properties-table/Property'
import { PropertyValue } from '@/modules/base/model/properties-table/PropertyValue'
import { KeywordValue } from '@/modules/base/model/properties-table/KeywordValue'
import SchemaContainer from '@/modules/schema-viewer/viewer/component/SchemaContainer.vue'
import NameVariants from '@/modules/schema-viewer/viewer/component/NameVariants.vue'
import { computed } from 'vue'
import { MultiValueFlagValue } from '@/modules/base/model/properties-table/MultiValueFlagValue.ts'
import { List } from 'immutable'
import { EntityScope } from '@/modules/database-driver/request-response/schema/EntityScope.ts'
import { AttributeUniquenessType } from '@/modules/database-driver/request-response/schema/AttributeUniquenessType.ts'
import { getEnumKeyByValue } from '@/utils/enum.ts'

const { t } = useI18n()

const props = defineProps<{
    dataPointer: SchemaViewerDataPointer,
    schema: AttributeSchema
}>()

const keys = ref<string[]>([getEnumKeyByValue(EntityScope, EntityScope.Live), getEnumKeyByValue(EntityScope, EntityScope.Archive)])

const globalAttribute = props.schema instanceof GlobalAttributeSchema
const entityAttribute = props.schema instanceof EntityAttributeSchema

const properties = computed<Property[]>(() => {
    const properties: Property[] = []

    properties.push(new Property(t('schemaViewer.attribute.label.type'), new PropertyValue(new KeywordValue(props.schema.type))))
    properties.push(new Property(t('schemaViewer.attribute.label.description'), new PropertyValue(props.schema.description)))
    properties.push(new Property(t('schemaViewer.attribute.label.deprecationNotice'), new PropertyValue(props.schema.deprecationNotice)))
    if (entityAttribute) properties.push(new Property(t('schemaViewer.attribute.label.representative'), new PropertyValue((props.schema).representative)))
    properties.push(new Property(t('schemaViewer.attribute.label.sortable'), List(keys.value.map(x => new PropertyValue(new MultiValueFlagValue(
        props.schema.sortableInScopes.some(y => getEnumKeyByValue(EntityScope, y) === x), t(`schemaViewer.attribute.label.${x.toLowerCase()}`),
        props.schema.sortableInScopes.some(q => getEnumKeyByValue(EntityScope, q) === x) ? t('schemaViewer.attribute.tooltip.content', [
            t('schemaViewer.tooltip.sorted'),
            t(`schemaViewer.tooltip.${x.toLowerCase()}`)
        ]) : t('schemaViewer.attribute.tooltip.contentNegation', [
            t('schemaViewer.tooltip.sorted'),
            t(`schemaViewer.tooltip.${x.toLowerCase()}`)
        ]), props.schema.sortableInScopes.some(y => getEnumKeyByValue(EntityScope, y) === x) ? 'mdi-check' : 'mdi-close'))))))

    if (props.schema.uniqueInScopes.size > 0) {
        properties.push(new Property(t('schemaViewer.attribute.label.filterable'), List(keys.value.map(x => new PropertyValue(new MultiValueFlagValue(
            props.schema.filteredInScopes.some(y => getEnumKeyByValue(EntityScope, y) === x), t(`schemaViewer.attribute.label.${x.toLowerCase()}`) + ` (${t(`schemaViewer.attribute.label.filteredDueToUnique`).toLowerCase()})`, t('schemaViewer.attribute.tooltip.filterableUnique', [t('schemaViewer.tooltip.filtered'), props.schema.filteredInScopes.map(z => t(`schemaViewer.tooltip.${getEnumKeyByValue(EntityScope, z).toLowerCase()}`)).join('/')]), getEnumKeyByValue(EntityScope, EntityScope.Live) === x ? 'mdi-check' : 'mdi-close'))))))
    } else {
        properties.push(new Property(
            t('schemaViewer.attribute.label.filterable'),
            List(
                keys.value.map(x =>
                    new PropertyValue(new MultiValueFlagValue(
                        props.schema.filteredInScopes.some(y => getEnumKeyByValue(EntityScope, y) === x),
                        t(`schemaViewer.attribute.label.${x.toLowerCase()}`),
                        props.schema.filteredInScopes.some(q => getEnumKeyByValue(EntityScope, q) === x) ? t('schemaViewer.attribute.tooltip.content', [
                            t('schemaViewer.tooltip.filtered'),
                            t(`schemaViewer.tooltip.${x.toLowerCase()}`)
                        ]) : t('schemaViewer.attribute.tooltip.contentNegation', [
                            t('schemaViewer.tooltip.filtered'),
                            t(`schemaViewer.tooltip.${x.toLowerCase()}`)
                        ]),
                        props.schema.filteredInScopes.some(y => getEnumKeyByValue(EntityScope, y) === x)
                            ? 'mdi-check'
                            : 'mdi-close'
                    ))
                )
            )
        ))
    }

    for (const group of props.schema.uniqueInScopes.groupBy(x => x.uniquenessType)) {
        switch (group[0]) {
            case AttributeUniquenessType.NotUnique:
                properties.push(new Property(t('schemaViewer.attribute.label.unique'), List(keys.value.map(x => new PropertyValue(new MultiValueFlagValue(
                    group[1].some(y => getEnumKeyByValue(EntityScope, y.scope) === x), t(`schemaViewer.attribute.label.${x.toLowerCase()}`), group[1].map(z => t(`schemaViewer.tooltip.${getEnumKeyByValue(EntityScope, z.scope).toLowerCase()}`)).join('/'), props.schema.uniqueInScopes.some(y => getEnumKeyByValue(EntityScope, y.scope) === x) ? 'mdi-check' : 'mdi-close'))))))
                break
            case AttributeUniquenessType.UniqueWithinCollectionLocale:
                properties.push(new Property(t('schemaViewer.attribute.label.unique'), List(keys.value.map(x => new PropertyValue(new MultiValueFlagValue(
                    group[1].some(y => getEnumKeyByValue(EntityScope, y.scope) === x), t(`schemaViewer.attribute.label.${x.toLowerCase()}`) + ` (${t(`schemaViewer.attribute.label.uniqueWithinCollection`)})`, t('schemaViewer.attribute.help.uniqueWithinCollection', [t('schemaViewer.tooltip.unique'), group[1].map(z => t(`schemaViewer.tooltip.${getEnumKeyByValue(EntityScope, z.scope).toLowerCase()}`)).join('/')]), props.schema.uniqueInScopes.some(y => getEnumKeyByValue(EntityScope, y.scope) === x) ? 'mdi-check' : 'mdi-close'))))))
                break
            case AttributeUniquenessType.UniqueWithinCollection:
                properties.push(new Property(t('schemaViewer.attribute.label.unique'), List(keys.value.map(x => new PropertyValue(new MultiValueFlagValue(
                    group[1].some(y => getEnumKeyByValue(EntityScope, y.scope) === x), t(`schemaViewer.attribute.label.${x.toLowerCase()}`) + ` (${t(`schemaViewer.attribute.label.uniqueWithinLocaleOfCollection`)})`, t('schemaViewer.attribute.help.uniqueWithinLocaleOfCollection', [t('schemaViewer.tooltip.unique'), group[1].map(z => t(`schemaViewer.tooltip.${getEnumKeyByValue(EntityScope, z.scope).toLowerCase()}`)).join('/')]), props.schema.uniqueInScopes.some(y => getEnumKeyByValue(EntityScope, y.scope) === x) ? 'mdi-check' : 'mdi-close'))))))
                break
        }
    }

    properties.push(new Property(t('schemaViewer.attribute.label.localized'), new PropertyValue(props.schema.localized)))
    properties.push(new Property(t('schemaViewer.attribute.label.nullable'), new PropertyValue(props.schema.nullable)))
    properties.push(new Property(t('schemaViewer.attribute.label.defaultValue'), new PropertyValue(props.schema.defaultValue)))
    properties.push(new Property(t('schemaViewer.attribute.label.indexedDecimalPlaces'), new PropertyValue(props.schema.indexedDecimalPlaces)))

    return properties
})
</script>

<template>
    <SchemaContainer :properties="properties">
        <template #nested-details>
            <NameVariants :name-variants="schema.nameVariants" />
        </template>
    </SchemaContainer>
</template>

<style lang="scss" scoped>

</style>
