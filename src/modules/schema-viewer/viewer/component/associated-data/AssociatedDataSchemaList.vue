<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { SchemaViewerDataPointer } from '@/modules/schema-viewer/viewer/model/SchemaViewerDataPointer'
import { AssociatedDataSchema } from '@/modules/connection/model/schema/AssociatedDataSchema'
import SchemaContainerSection from '@/modules/schema-viewer/viewer/component/SchemaContainerSection.vue'
import SchemaContainerSectionList from '@/modules/schema-viewer/viewer/component/SchemaContainerSectionList.vue'
import AssociatedDataSchemaListItem
    from '@/modules/schema-viewer/viewer/component/associated-data/AssociatedDataSchemaListItem.vue'
import { List } from 'immutable'

const { t } = useI18n()

const props = defineProps<{
    dataPointer: SchemaViewerDataPointer,
    associatedData: List<AssociatedDataSchema>
}>()
</script>

<template>
    <SchemaContainerSection :name="t('schemaViewer.associatedData.title')">
        <SchemaContainerSectionList
            :items="associatedData"
            :nameSupplier="item => item.name"
            v-slot="{ item }"
        >
            <AssociatedDataSchemaListItem
                :data-pointer="dataPointer"
                :schema="item"
            />
        </SchemaContainerSectionList>
    </SchemaContainerSection>
</template>

<style lang="scss" scoped>

</style>
