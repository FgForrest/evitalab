<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import SchemaContainerSectionListItem from '@/modules/schema-viewer/viewer/component/SchemaContainerSectionListItem.vue'
import VListItemDivider from '@/modules/base/component/VListItemDivider.vue'
import { List } from 'immutable'

const { t } = useI18n()

const props = defineProps<{
    items: List<any>,
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
            :label="t('schemaViewer.section.label.filter')"
            :append-inner-icon="filter ? 'mdi-close-circle-outline' : null as any"
            @update:model-value="filter = $event.toLowerCase()"
            @click:append-inner="filter = ''"
        />

        <template
            v-for="(item, index) in filteredItems"
            :key="nameSupplier(item)"
        >
            <slot :item="item" />
            <VListItemDivider v-if="index < filteredItems.size - 1"/>
        </template>

        <SchemaContainerSectionListItem
            v-if="filteredItems.size === 0"
            :name="t('schemaViewer.section.placeholder.noItemsForSearchedTerm')"
            :openable="false"
        />
    </VList>
</template>

<style lang="scss" scoped>

</style>
