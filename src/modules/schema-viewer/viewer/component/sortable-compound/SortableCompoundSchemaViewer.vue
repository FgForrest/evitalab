<script setup lang="ts">
import type { SchemaViewerDataPointer } from '@/modules/schema-viewer/viewer/model/SchemaViewerDataPointer.ts'
import type {
    SortableAttributeCompoundSchema
} from '@/modules/database-driver/request-response/schema/SortableAttributeCompoundSchema.ts'
import SchemaContainer from '@/modules/schema-viewer/viewer/component/SchemaContainer.vue'
import { Property } from '@/modules/base/model/properties-table/Property.ts'
import NameVariants from '@/modules/schema-viewer/viewer/component/NameVariants.vue'

const props = defineProps<{
    dataPointer: SchemaViewerDataPointer,
    schema: SortableAttributeCompoundSchema
}>()

const properties = computed<Property[]>(() => [

])

onMounted(() => {
    console.log(props.schema)
})
</script>

<template>
    <SchemaContainer :properties="properties">
        <template #nested-details>
        </template>
    </SchemaContainer>
</template>

<style scoped lang="scss">

</style>
