<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { SchemaViewerDataPointer } from '@/modules/schema-viewer/viewer/model/SchemaViewerDataPointer'
import { AssociatedDataSchema } from '@/modules/database-driver/request-response/schema/AssociatedDataSchema'
import { Property } from '@/modules/base/model/properties-table/Property'
import { PropertyValue } from '@/modules/base/model/properties-table/PropertyValue'
import { KeywordValue } from '@/modules/base/model/properties-table/KeywordValue'
import { Scalar } from '@/modules/database-driver/data-type/Scalar'
import SchemaContainer from '@/modules/schema-viewer/viewer/component/SchemaContainer.vue'
import NameVariants from '@/modules/schema-viewer/viewer/component/NameVariants.vue'
import { computed } from 'vue'

const { t } = useI18n()

const props = defineProps<{
    dataPointer: SchemaViewerDataPointer,
    schema: AssociatedDataSchema
}>()

const properties = computed<Property[]>(() => [
    new Property(t('schemaViewer.associatedDatum.label.type'), new PropertyValue(new KeywordValue(props.schema.type.replace(Scalar.ComplexDataObject, 'Object')))),
    new Property(t('schemaViewer.associatedDatum.label.description'), new PropertyValue(props.schema.description)),
    new Property(t('schemaViewer.associatedDatum.label.deprecationNotice'), new PropertyValue(props.schema.deprecationNotice)),
    new Property(t('schemaViewer.associatedDatum.label.localized'), new PropertyValue(props.schema.localized)),
    new Property(t('schemaViewer.associatedDatum.label.nullable'), new PropertyValue(props.schema.nullable))
])

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
