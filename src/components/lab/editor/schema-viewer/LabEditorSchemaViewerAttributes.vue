<script setup lang="ts">
import { SchemaViewerDataPointer } from '@/model/editor/schema-viewer'
import LabEditorViewerAttributesItem from './LabEditorSchemaViewerAttributesItem.vue'
import LabEditorSchemaViewerContainerSection from './LabEditorSchemaViewerContainerSection.vue'
import { AttributeSchemaUnion } from '@/model/evitadb'
import LabEditorSchemaViewerContainerSectionList
    from '@/components/lab/editor/schema-viewer/LabEditorSchemaViewerContainerSectionList.vue'

const props = defineProps<{
    dataPointer: SchemaViewerDataPointer,
    attributes: AttributeSchemaUnion[]
}>()
</script>

<template>
    <LabEditorSchemaViewerContainerSection name="Attributes">
        <LabEditorSchemaViewerContainerSectionList
            :items="attributes"
            :nameSupplier="item => item.name"
            v-slot="{ item }"
        >
            <LabEditorViewerAttributesItem
                :data-pointer="dataPointer"
                :schema="item"
            />
        </LabEditorSchemaViewerContainerSectionList>
    </LabEditorSchemaViewerContainerSection>
</template>

<style lang="scss" scoped>

</style>
