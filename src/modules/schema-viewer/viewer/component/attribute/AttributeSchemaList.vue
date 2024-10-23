<script setup lang="ts">

import { useI18n } from 'vue-i18n'
import { SchemaViewerDataPointer } from '@/modules/schema-viewer/viewer/model/SchemaViewerDataPointer'
import { AttributeSchema } from '@/modules/connection/model/schema/AttributeSchema'
import SchemaContainerSection from '@/modules/schema-viewer/viewer/component/SchemaContainerSection.vue'
import SchemaContainerSectionList from '@/modules/schema-viewer/viewer/component/SchemaContainerSectionList.vue'
import AttributeSchemaListItem from '@/modules/schema-viewer/viewer/component/attribute/AttributeSchemaListItem.vue'
import { List } from 'immutable'

const { t } = useI18n()

const props = defineProps<{
    dataPointer: SchemaViewerDataPointer,
    attributes: List<AttributeSchema>
}>()
</script>

<template>
    <SchemaContainerSection :name="t('schemaViewer.attributes.title')">
        <SchemaContainerSectionList
            :items="attributes"
            :nameSupplier="item => item.name"
            v-slot="{ item }"
        >
            <AttributeSchemaListItem
                :data-pointer="dataPointer"
                :schema="item"
            />
        </SchemaContainerSectionList>
    </SchemaContainerSection>
</template>

<style lang="scss" scoped>

</style>
