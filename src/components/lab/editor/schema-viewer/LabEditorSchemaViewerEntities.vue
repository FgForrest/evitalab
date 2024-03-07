<script setup lang="ts">
import LabEditorSchemaViewerEntitiesItem from './LabEditorSchemaViewerEntitiesItem.vue'
import LabEditorSchemaViewerContainerSection from './LabEditorSchemaViewerContainerSection.vue'
import { EntitySchema } from '@/model/evitadb'
import LabEditorSchemaViewerContainerSectionList
    from '@/components/lab/editor/schema-viewer/LabEditorSchemaViewerContainerSectionList.vue'
import { SchemaViewerDataPointer } from '@/model/editor/tab/schemaViewer/SchemaViewerDataPointer'

const props = defineProps<{
    dataPointer: SchemaViewerDataPointer,
    entities: EntitySchema[]
}>()
</script>

<template>
    <LabEditorSchemaViewerContainerSection name="Entities">
        <LabEditorSchemaViewerContainerSectionList
            :items="entities"
            :nameSupplier="item => item.name"
            v-slot="{ item }"
        >
            <LabEditorSchemaViewerEntitiesItem
                :data-pointer="dataPointer"
                :schema="item"
            />
        </LabEditorSchemaViewerContainerSectionList>
    </LabEditorSchemaViewerContainerSection>
</template>

<style lang="scss" scoped>

</style>
