<script setup lang="ts">
import type { SchemaViewerDataPointer } from '@/modules/schema-viewer/viewer/model/SchemaViewerDataPointer.ts'
import type {
    SortableAttributeCompoundSchema
} from '@/modules/database-driver/request-response/schema/SortableAttributeCompoundSchema.ts'
import SchemaContainer from '@/modules/schema-viewer/viewer/component/SchemaContainer.vue'
import { Property } from '@/modules/base/model/properties-table/Property.ts'
import NameVariants from '@/modules/schema-viewer/viewer/component/NameVariants.vue'
import { PropertyValue } from '@/modules/base/model/properties-table/PropertyValue.ts'
import { useI18n } from 'vue-i18n'
import AttributeElementList from '@/modules/schema-viewer/viewer/component/attribute-element/AttributeElementList.vue'

const { t } = useI18n()

const props = defineProps<{
    dataPointer: SchemaViewerDataPointer,
    schema: SortableAttributeCompoundSchema
}>()

const properties = computed<Property[]>(() => [
    new Property(t("schemaViewer.sortableCompound.label.name"), new PropertyValue(props.schema.name)),
    new Property(t("schemaViewer.sortableCompound.label.deprecationNotice"), new PropertyValue(props.schema.deprecationNotice)),
    new Property(t("schemaViewer.sortableCompound.label.description"), new PropertyValue(props.schema.description))
])

</script>

<template>
    <SchemaContainer :properties="properties">
        <template #nested-details>
            <NameVariants :name-variants="schema.nameVariants" />
            <AttributeElementList :data-pointer="dataPointer" :attributes="schema.attributeElements" />
        </template>
    </SchemaContainer>
</template>

<style scoped lang="scss">
</style>
