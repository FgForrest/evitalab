<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { SchemaViewerDataPointer } from '@/modules/schema-viewer/viewer/model/SchemaViewerDataPointer'
import ReferenceSchemaListItem from '@/modules/schema-viewer/viewer/component/reference/ReferenceSchemaListItem.vue'
import SchemaContainerSectionList from '@/modules/schema-viewer/viewer/component/SchemaContainerSectionList.vue'
import SchemaContainerSection from '@/modules/schema-viewer/viewer/component/SchemaContainerSection.vue'
import { List } from 'immutable'
import { ReferenceSchema } from '@/modules/connection/model/schema/ReferenceSchema'

const { t } = useI18n()

const props = defineProps<{
    dataPointer: SchemaViewerDataPointer,
    references: List<ReferenceSchema>
}>()
</script>

<template>
    <SchemaContainerSection :name="t('schemaViewer.references.title')">
        <SchemaContainerSectionList
            :items="references"
            :nameSupplier="item => item.name"
            v-slot="{ item }"
        >
            <ReferenceSchemaListItem
                :data-pointer="dataPointer"
                :schema="item"
            />
        </SchemaContainerSectionList>
    </SchemaContainerSection>
</template>

<style lang="scss" scoped>

</style>
