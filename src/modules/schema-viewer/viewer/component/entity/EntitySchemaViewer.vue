<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { SchemaViewerDataPointer } from '@/modules/schema-viewer/viewer/model/SchemaViewerDataPointer'
import { EntitySchema } from '@/modules/database-driver/request-response/schema/EntitySchema'
import { Property } from '@/modules/base/model/properties-table/Property'
import { PropertyValue } from '@/modules/base/model/properties-table/PropertyValue'
import { KeywordValue } from '@/modules/base/model/properties-table/KeywordValue'
import { List } from 'immutable'
import AttributeSchemaList from '@/modules/schema-viewer/viewer/component/attribute/AttributeSchemaList.vue'
import NameVariants from '@/modules/schema-viewer/viewer/component/NameVariants.vue'
import SchemaContainer from '@/modules/schema-viewer/viewer/component/SchemaContainer.vue'
import AssociatedDataSchemaList
    from '@/modules/schema-viewer/viewer/component/associated-data/AssociatedDataSchemaList.vue'
import ReferenceSchemaList from '@/modules/schema-viewer/viewer/component/reference/ReferenceSchemaList.vue'
import { i18n } from '@/vue-plugins/i18n'

const { t } = useI18n()

const props = defineProps<{
    dataPointer: SchemaViewerDataPointer,
    schema: EntitySchema
}>()

const properties = computed<Property[]>(() => [
    new Property(t('schemaViewer.entity.label.version'), new PropertyValue(props.schema.version)),
    new Property(t('schemaViewer.entity.label.description'), new PropertyValue(props.schema.description)),
    new Property(t('schemaViewer.entity.label.deprecationNotice'), new PropertyValue(props.schema.deprecationNotice)),
    new Property(t('schemaViewer.entity.label.locales'), props.schema.locales.map(locale => new PropertyValue(new KeywordValue(locale.toString())))),
    new Property(t('schemaViewer.entity.label.currencies'), List(props.schema.currencies.values()).map(currency => new PropertyValue(new KeywordValue(currency.toString())))),
    new Property(t('schemaViewer.entity.label.generatedPrimaryKey'), new PropertyValue(props.schema.withGeneratedPrimaryKey)),
    new Property(t('schemaViewer.entity.label.hierarchical'), new PropertyValue(props.schema.withHierarchy)),
    new Property(t('schemaViewer.entity.label.prices'), new PropertyValue(props.schema.withPrice)),
    new Property(t('schemaViewer.entity.label.indexedDecimalPlaces'), new PropertyValue(props.schema.indexedPricePlaces)),
    new Property(
        t('schemaViewer.entity.label.evolutionModes'),
        props.schema.evolutionMode.map(mode => {
            return new PropertyValue(new KeywordValue(
                i18n.global.t(`schemaViewer.entity.evolutionMode.${mode}`)
            ))
        })
    )
])
</script>

<template>
    <SchemaContainer :properties="properties">
        <template #nested-details>
            <NameVariants :name-variants="schema.nameVariants" />

            <AttributeSchemaList
                v-if="schema.attributes && schema.attributes.size > 0"
                :data-pointer="dataPointer"
                :attributes="List(schema.attributes.values())"
            />

            <AssociatedDataSchemaList
                v-if="schema.associatedData && schema.associatedData.size > 0"
                :data-pointer="dataPointer"
                :associated-data="List(schema.associatedData.values())"
            />

            <ReferenceSchemaList
                v-if="schema.references && schema.references.size > 0"
                :data-pointer="dataPointer"
                :references="List(schema.references.values())"
            />
        </template>
    </SchemaContainer>
</template>

<style lang="scss" scoped>

</style>
