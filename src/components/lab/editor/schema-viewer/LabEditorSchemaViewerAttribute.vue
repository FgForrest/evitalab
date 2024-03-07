<script setup lang="ts">
import LabEditorViewerNameVariants from './LabEditorSchemaViewerNameVariants.vue'
import LabEditorViewerContainer from './LabEditorSchemaViewerContainer.vue'
import {
    AttributeSchemaUnion,
    AttributeUniquenessType,
    EntityAttributeSchema,
    GlobalAttributeSchema,
    GlobalAttributeUniquenessType
} from '@/model/evitadb'
import {
    MultiValueFlagValue,
    KeywordValue,
    Property,
    PropertyValue,
    NotApplicableValue
} from '@/model/properties-table'
import { SchemaViewerDataPointer } from '@/model/editor/tab/schemaViewer/SchemaViewerDataPointer'

const props = defineProps<{
    dataPointer: SchemaViewerDataPointer,
    schema: AttributeSchemaUnion
}>()

const globalAttribute = 'globalUniquenessType' in props.schema
const entityAttribute = 'representative' in props.schema

const properties: Property[] = []
properties.push({ name: 'Type', value: new PropertyValue(new KeywordValue(props.schema.type)) })
properties.push({ name: 'Description', value: new PropertyValue(props.schema.description) })
properties.push({ name: 'Deprecation notice', value: new PropertyValue(props.schema.deprecationNotice) })
if (entityAttribute) properties.push({ name: 'Representative', value: new PropertyValue((props.schema as EntityAttributeSchema).representative as boolean ) })
switch (props.schema.uniquenessType) {
    case AttributeUniquenessType.NotUnique:
        properties.push({ name: 'Unique', value: new PropertyValue(false) });
        break
    case AttributeUniquenessType.UniqueWithinCollection:
        properties.push({
            name: 'Unique',
            value: new PropertyValue(new MultiValueFlagValue(
                true,
                'Within collection',
                'The attribute value must be unique among all the entities of the same collection.'
            ))
        });
        break
    case AttributeUniquenessType.UniqueWithinCollectionLocale:
        properties.push({
            name: 'Unique',
            value: new PropertyValue(new MultiValueFlagValue(
                true,
                'Within locale of collection',
                'The localized attribute value must be unique among all values of the same locale among all the entities.'
            ))
        });
        break
}
if (globalAttribute) {
    switch ((props.schema as GlobalAttributeSchema).globalUniquenessType) {
        case GlobalAttributeUniquenessType.NotUnique:
            properties.push({ name: 'Globally unique', value: new PropertyValue(false) });
            break
        case GlobalAttributeUniquenessType.UniqueWithinCatalog:
            properties.push({
                name: 'Globally unique',
                value: new PropertyValue(new MultiValueFlagValue(
                    true,
                    'Within catalog',
                    'The attribute value (either localized or non-localized) must be unique among all values among all the entities using this global attribute schema in the entire catalog.'
                ))
            });
            break
        case GlobalAttributeUniquenessType.UniqueWithinCatalogLocale:
            properties.push({
                name: 'Globally unique',
                value: new PropertyValue(new MultiValueFlagValue(
                    true,
                    'Within locale of catalog',
                    'The localized attribute value must be unique among all values of the same locale among all the entities using this global attribute schema in the entire catalog.'
                ))
            });
            break
    }
}
if (props.schema.filterable) {
    properties.push({ name: 'Filterable', value: new PropertyValue(true) })
} else if ((globalAttribute && (props.schema as GlobalAttributeSchema).globalUniquenessType != GlobalAttributeUniquenessType.NotUnique) ||
    props.schema.uniquenessType != AttributeUniquenessType.NotUnique) {
    // implicitly filterable because of unique index
    properties.push({
        name: 'Filterable',
        value: new PropertyValue(new NotApplicableValue('The attribute is implicitly filterable because it is unique.'))
    })
} else {
    properties.push({ name: 'Filterable', value: new PropertyValue(false) })
}
properties.push({ name: 'Sortable', value: new PropertyValue(props.schema.sortable as boolean) })
properties.push({ name: 'Localized', value: new PropertyValue(props.schema.localized as boolean) })
properties.push({ name: 'Nullable', value: new PropertyValue(props.schema.nullable as boolean) })
properties.push({ name: 'Default value', value: new PropertyValue(props.schema.defaultValue) })
properties.push({ name: 'Indexed decimal places', value: new PropertyValue(props.schema.indexedDecimalPlaces) })

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
