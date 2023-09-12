<script setup lang="ts">
import { SchemaViewerDataPointer } from '@/model/editor/schema-viewer'
import LabEditorViewerReferencesItem from './LabEditorSchemaViewerReferencesItem.vue'
import LabEditorSchemaViewerContainerSection from './LabEditorSchemaViewerContainerSection.vue'
import { ReferenceSchema } from '@/model/evitadb'
import LabEditorSchemaViewerContainerSectionList
    from '@/components/lab/editor/schema/LabEditorSchemaViewerContainerSectionList.vue'

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
