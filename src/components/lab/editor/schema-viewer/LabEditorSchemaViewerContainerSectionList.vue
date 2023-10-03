<script setup lang="ts">
import { computed, ref } from 'vue'
import LabEditorSchemaViewerContainerSectionListItem
    from '@/components/lab/editor/schema-viewer/LabEditorSchemaViewerContainerSectionListItem.vue'

const props = defineProps<{
    items: any[],
    nameSupplier: (item: any) => string
}>()

const filter = ref<string>('')
const filteredItems = computed(() => {
    if (!filter.value) {
        return props.items
    }
    return props.items
        .filter(it => props.nameSupplier(it).toLowerCase().includes(filter.value))
})
</script>

<template>
    <VList
        density="compact"
        lines="two"
    >
        <VTextField
            :model-value="filter"
            label="Filter"
            variant="solo-filled"
            density="compact"
            :append-inner-icon="filter ? 'mdi-backspace' : null as any"
            @update:model-value="filter = $event.toLowerCase()"
            @click:append-inner="filter = ''"
        />

        <template
            v-for="(item, index) in filteredItems"
            :key="nameSupplier(item)"
        >
            <slot :item="item" />
            <VDivider v-if="index < filteredItems.length - 1" />
        </template>

        <LabEditorSchemaViewerContainerSectionListItem
            v-if="filteredItems.length === 0"
            name="No items found for searched term."
            :openable="false"
        />
    </VList>
</template>

<style lang="scss" scoped>

</style>
