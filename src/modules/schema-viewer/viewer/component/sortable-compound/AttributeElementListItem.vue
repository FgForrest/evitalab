<script setup lang="ts">

import SchemaContainerSectionListItem from '@/modules/schema-viewer/viewer/component/SchemaContainerSectionListItem.vue'
import type { SchemaViewerDataPointer } from '@/modules/schema-viewer/viewer/model/SchemaViewerDataPointer.ts'
import type {
    AttributeElement
} from '@/modules/database-driver/request-response/schema/SortableAttributeCompoundSchema.ts'
import { List as ImmutableList } from 'immutable'

const props = defineProps<{
    dataPointer: SchemaViewerDataPointer,
    schema: AttributeElement
}>()

const flags = computed(() => {
    return ImmutableList([props.schema.behaviour, props.schema.direction])
})
</script>

<template>
    <SchemaContainerSectionListItem :name="schema.attributeName" :flags="flags" />
</template>

<style scoped lang="scss">

</style>
