<script setup lang="ts">

import { useI18n } from 'vue-i18n'
import { SchemaViewerDataPointer } from '@/modules/schema-viewer/viewer/model/SchemaViewerDataPointer'
import { GlobalAttributeSchema } from '@/modules/connection/model/schema/GlobalAttributeSchema'
import { EntityAttributeSchema } from '@/modules/connection/model/schema/EntityAttributeSchema'
import { AttributeSchema } from '@/modules/connection/model/schema/AttributeSchema'
import { Property } from '@/modules/base/model/properties-table/Property'
import { PropertyValue } from '@/modules/base/model/properties-table/PropertyValue'
import { KeywordValue } from '@/modules/base/model/properties-table/KeywordValue'
import { AttributeUniquenessType } from '@/modules/connection/model/schema/AttributeUniquenessType'
import { MultiValueFlagValue } from '@/modules/base/model/properties-table/MultiValueFlagValue'
import { GlobalAttributeUniquenessType } from '@/modules/connection/model/schema/GlobalAttributeUniquenessType'
import { NotApplicableValue } from '@/modules/base/model/properties-table/NotApplicableValue'
import SchemaContainer from '@/modules/schema-viewer/viewer/component/SchemaContainer.vue'
import NameVariants from '@/modules/schema-viewer/viewer/component/NameVariants.vue'
import { computed } from 'vue'

const { t } = useI18n()

const props = defineProps<{
    dataPointer: SchemaViewerDataPointer,
    schema: AttributeSchema
}>()

const globalAttribute = props.schema instanceof GlobalAttributeSchema
const entityAttribute = props.schema instanceof EntityAttributeSchema

const properties = computed<Property[]>(() => {
    const properties: Property[] = []

    properties.push(new Property(t('schemaViewer.attribute.label.type'), new PropertyValue(new KeywordValue(props.schema.type.getIfSupported()!))))
    properties.push(new Property(t('schemaViewer.attribute.label.description'), new PropertyValue(props.schema.description.getIfSupported()!)))
    properties.push(new Property(t('schemaViewer.attribute.label.deprecationNotice'), new PropertyValue(props.schema.deprecationNotice.getIfSupported()!)))
    if (entityAttribute) properties.push(new Property(t('schemaViewer.attribute.label.representative'), new PropertyValue((props.schema as EntityAttributeSchema).representative.getOrElse(false) )))
    switch (props.schema.uniquenessType.getIfSupported()!) {
        case AttributeUniquenessType.NotUnique:
            properties.push(new Property(
                t('schemaViewer.attribute.label.unique'),
                new PropertyValue(false)
            ))
            break
        case AttributeUniquenessType.UniqueWithinCollection:
            properties.push(new Property(
                t('schemaViewer.attribute.label.unique'),
                new PropertyValue(new MultiValueFlagValue(
                    true,
                    t('schemaViewer.attribute.placeholder.uniqueWithinCollection'),
                    t('schemaViewer.attribute.help.uniqueWithinCollection')
                ))
            ))
            break
        case AttributeUniquenessType.UniqueWithinCollectionLocale:
            properties.push(new Property(
                t('schemaViewer.attribute.label.unique'),
                new PropertyValue(new MultiValueFlagValue(
                    true,
                    t('schemaViewer.attribute.placeholder.uniqueWithinLocaleOfCollection'),
                    t('schemaViewer.attribute.help.uniqueWithinLocaleOfCollection')
                ))
            ))
            break
    }
    if (globalAttribute) {
        switch ((props.schema as GlobalAttributeSchema).globalUniquenessType.getIfSupported()!) {
            case GlobalAttributeUniquenessType.NotUnique:
                properties.push(new Property(
                    t('schemaViewer.attribute.label.globallyUnique'),
                    new PropertyValue(false)
                ))
                break
            case GlobalAttributeUniquenessType.UniqueWithinCatalog:
                properties.push(new Property(
                    t('schemaViewer.attribute.label.globallyUnique'),
                    new PropertyValue(new MultiValueFlagValue(
                        true,
                        t('schemaViewer.attribute.placeholder.globallyUniqueWithinCatalog'),
                        t('schemaViewer.attribute.help.globallyUniqueWithinCatalog')
                    ))
                ))
                break
            case GlobalAttributeUniquenessType.UniqueWithinCatalogLocale:
                properties.push(new Property(
                    t('schemaViewer.attribute.label.globallyUnique'),
                    new PropertyValue(new MultiValueFlagValue(
                        true,
                        t('schemaViewer.attribute.placeholder.globallyUniqueWithinLocaleOfCatalog'),
                        t('schemaViewer.attribute.help.globallyUniqueWithinLocaleOfCatalog')
                    ))
                ))
                break
        }
    }
    if (props.schema.filterable.getOrElse(false)) {
        properties.push(new Property(t('schemaViewer.attribute.label.filterable'), new PropertyValue(true)))
    } else if ((globalAttribute && (props.schema as GlobalAttributeSchema).globalUniquenessType.getIfSupported()! != GlobalAttributeUniquenessType.NotUnique) ||
        props.schema.uniquenessType.getIfSupported()! != AttributeUniquenessType.NotUnique) {
        // implicitly filterable because of unique index
        properties.push(new Property(
            t('schemaViewer.attribute.label.filterable'),
            new PropertyValue(new NotApplicableValue(t('schemaViewer.attribute.help.implicitlyFilterable')))
        ))
    } else {
        properties.push(new Property(t('schemaViewer.attribute.label.filterable'), new PropertyValue(false) ))
    }
    properties.push(new Property(t('schemaViewer.attribute.label.sortable'), new PropertyValue(props.schema.sortable.getOrElse(false)) ))
    properties.push(new Property(t('schemaViewer.attribute.label.localized'), new PropertyValue(props.schema.localized.getOrElse(false)) ))
    properties.push(new Property(t('schemaViewer.attribute.label.nullable'), new PropertyValue(props.schema.nullable.getOrElse(false)) ))
    properties.push(new Property(t('schemaViewer.attribute.label.defaultValue'), new PropertyValue(props.schema.defaultValue.getIfSupported()!) ))
    properties.push(new Property(t('schemaViewer.attribute.label.indexedDecimalPlaces'), new PropertyValue(props.schema.indexedDecimalPlaces.getIfSupported()!) ))

    return properties
})
</script>

<template>
    <SchemaContainer :properties="properties">
        <template #nested-details>
            <NameVariants :name-variants="schema.nameVariants.getIfSupported()!" />
        </template>
    </SchemaContainer>
</template>

<style lang="scss" scoped>

</style>
