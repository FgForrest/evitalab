<script setup lang="ts">

import { useI18n } from 'vue-i18n'
import { SchemaViewerDataPointer } from '@/modules/schema-viewer/viewer/model/SchemaViewerDataPointer'
import { EntitySchema } from '@/modules/connection/model/schema/EntitySchema'
import SchemaContainerSection from '@/modules/schema-viewer/viewer/component/SchemaContainerSection.vue'
import SchemaContainerSectionList from '@/modules/schema-viewer/viewer/component/SchemaContainerSectionList.vue'
import EntitySchemaListItem from '@/modules/schema-viewer/viewer/component/entity/EntitySchemaListItem.vue'
import { List } from 'immutable'

const { t } = useI18n()

const props = defineProps<{
    dataPointer: SchemaViewerDataPointer,
    entities: List<EntitySchema>
}>()
</script>

<template>
    <SchemaContainerSection :name="t('schemaViewer.entities.title')">
        <SchemaContainerSectionList
            :items="entities"
            :nameSupplier="item => item.name"
            v-slot="{ item }"
        >
            <EntitySchemaListItem
                :data-pointer="dataPointer"
                :schema="item"
            />
        </SchemaContainerSectionList>
    </SchemaContainerSection>
</template>

<style lang="scss" scoped>

</style>
