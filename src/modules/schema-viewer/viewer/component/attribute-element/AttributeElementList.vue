<script setup lang="ts">
import { List } from 'immutable'
import type {
    AttributeElement
} from '@/modules/database-driver/request-response/schema/SortableAttributeCompoundSchema.ts'
import SchemaContainerSection from '@/modules/schema-viewer/viewer/component/SchemaContainerSection.vue'
import SchemaContainerSectionList from '@/modules/schema-viewer/viewer/component/SchemaContainerSectionList.vue'
import AttributeElementListItem
    from '@/modules/schema-viewer/viewer/component/attribute-element/AttributeElementListItem.vue'
import type { SchemaViewerDataPointer } from '@/modules/schema-viewer/viewer/model/SchemaViewerDataPointer.ts'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
    dataPointer: SchemaViewerDataPointer
    attributes: List<AttributeElement>
}>()

const { t } = useI18n()
</script>

<template>
    <SchemaContainerSection :name="t('schemaViewer.sortableCompound.attributeElement.title')">
        <SchemaContainerSectionList :items="attributes" :name-supplier="item => item.attributeName" v-slot="{ item }">
            <AttributeElementListItem :data-pointer="dataPointer" :schema="item" />
        </SchemaContainerSectionList>
    </SchemaContainerSection>
</template>

<style scoped lang="scss">

</style>
