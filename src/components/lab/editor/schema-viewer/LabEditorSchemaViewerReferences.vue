<script setup lang="ts">
import LabEditorViewerReferencesItem from './LabEditorSchemaViewerReferencesItem.vue'
import LabEditorSchemaViewerContainerSection from './LabEditorSchemaViewerContainerSection.vue'
import { ReferenceSchema } from '@/model/evitadb'
import LabEditorSchemaViewerContainerSectionList
    from '@/components/lab/editor/schema-viewer/LabEditorSchemaViewerContainerSectionList.vue'
import { SchemaViewerDataPointer } from '@/model/editor/tab/schemaViewer/SchemaViewerDataPointer'

const props = defineProps<{
    dataPointer: SchemaViewerDataPointer,
    references: ReferenceSchema[]
}>()
</script>

<template>
    <LabEditorSchemaViewerContainerSection name="References">
        <LabEditorSchemaViewerContainerSectionList
            :items="references"
            :nameSupplier="item => item.name"
            v-slot="{ item }"
        >
            <LabEditorViewerReferencesItem
                :data-pointer="dataPointer"
                :schema="item"
            />
        </LabEditorSchemaViewerContainerSectionList>
    </LabEditorSchemaViewerContainerSection>
</template>

<style lang="scss" scoped>

</style>
