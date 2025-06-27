<script setup lang="ts">
import SchemaContainerSection from '@/modules/schema-viewer/viewer/component/SchemaContainerSection.vue'
import { useI18n } from 'vue-i18n'
import SchemaContainerSectionList from '@/modules/schema-viewer/viewer/component/SchemaContainerSectionList.vue'
import type { SchemaViewerDataPointer } from '@/modules/schema-viewer/viewer/model/SchemaViewerDataPointer.ts'
import { List } from 'immutable'
import type {
    SortableAttributeCompoundSchema
} from '@/modules/database-driver/request-response/schema/SortableAttributeCompoundSchema.ts'
import SortableCompoundSchemaListItem
    from '@/modules/schema-viewer/viewer/component/sortable-compound/SortableCompoundSchemaListItem.vue'

const { t } = useI18n()

const props = defineProps<{
    dataPointer: SchemaViewerDataPointer,
    sortableAttributeCompounds: List<SortableAttributeCompoundSchema>,
}>()

</script>

<template>
    <SchemaContainerSection :name="t('schemaViewer.sortableCompounds.title')">
        <SchemaContainerSectionList
            :items="sortableAttributeCompounds"
            :name-supplier="item => item.name"
            v-slot="{ item }">
                <SortableCompoundSchemaListItem
                    :data-pointer="dataPointer"
                    :schema="item"
                />
        </SchemaContainerSectionList>
    </SchemaContainerSection>
</template>

<style scoped lang="scss">

</style>
