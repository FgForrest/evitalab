<script setup lang="ts">
import LabEditorViewerAssociatedDataItem from './LabEditorSchemaViewerAssociatedDataItem.vue'
import LabEditorSchemaViewerContainerSection from './LabEditorSchemaViewerContainerSection.vue'
import { AssociatedDataSchema } from '@/model/evitadb'
import LabEditorSchemaViewerContainerSectionList
    from '@/components/lab/editor/schema-viewer/LabEditorSchemaViewerContainerSectionList.vue'
import { SchemaViewerDataPointer } from '@/model/editor/tab/schemaViewer/SchemaViewerDataPointer'

const props = defineProps<{
    dataPointer: SchemaViewerDataPointer,
    associatedData: AssociatedDataSchema[]
}>()
</script>

<template>
    <LabEditorSchemaViewerContainerSection name="Associated data">
        <LabEditorSchemaViewerContainerSectionList
            :items="associatedData"
            :nameSupplier="item => item.name"
            v-slot="{ item }"
        >
            <LabEditorViewerAssociatedDataItem
                :data-pointer="dataPointer"
                :schema="item"
            />
        </LabEditorSchemaViewerContainerSectionList>
    </LabEditorSchemaViewerContainerSection>
</template>

<style lang="scss" scoped>

</style>
