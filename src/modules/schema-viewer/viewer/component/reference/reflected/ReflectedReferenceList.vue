<script setup lang="ts">

import SchemaContainerSection from '@/modules/schema-viewer/viewer/component/SchemaContainerSection.vue'
import SchemaContainerSectionList from '@/modules/schema-viewer/viewer/component/SchemaContainerSectionList.vue'
import type { SchemaViewerDataPointer } from '@/modules/schema-viewer/viewer/model/SchemaViewerDataPointer.ts'
import type {
    ReflectedReferenceSchema
} from '@/modules/database-driver/request-response/schema/ReflectedReferenceSchema.ts'
import { List as ImmutableList } from 'immutable'
import ReflectedReferenceListItem
    from '@/modules/schema-viewer/viewer/component/reference/reflected/ReflectedReferenceListItem.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps<{
    dataPointer: SchemaViewerDataPointer,
    schemas: ImmutableList<ReflectedReferenceSchema>
    loading: boolean
}>()

</script>

<template>
    <SchemaContainerSection :loading="loading" :name="t('schemaViewer.reference.reflected.reflectedReferences')">
        <SchemaContainerSectionList :items="schemas" :name-supplier="item => item.name" v-slot="{ item }">
            <ReflectedReferenceListItem :data-pointer="dataPointer" :schema="item" />
        </SchemaContainerSectionList>
    </SchemaContainerSection>
</template>

<style scoped lang="scss">

</style>
