<script setup lang="ts">
import { computed } from 'vue'
import { EntityPropertyType } from '@/model/editor/data-grid'

const props = defineProps<{
    column: any,
    isSorted: (column: any) => boolean,
    getSortIcon: (column: any) => any,
    toggleSort: (column: any) => void
}>()

const prependIcon = computed<string | undefined>(() => {
    const propertyType: EntityPropertyType | undefined = props.column.descriptor?.type
    if (propertyType === EntityPropertyType.AssociatedData) {
        return 'mdi-package-variant-closed'
    }
    if (propertyType === EntityPropertyType.References) {
        return 'mdi-link-variant'
    }
    return undefined
})
const sortable = computed<boolean>(() => props.column.descriptor?.schema?.sortable)
const sorted = computed<boolean>(() => props.isSorted(props.column))
const localized = computed<boolean>(() => props.column.descriptor?.schema?.localized)

function handleClick() {
    if (sortable.value) {
        props.toggleSort(props.column)
    }
}
</script>

<template>
    <th
        @click="handleClick"
        :class="['data-grid-column-header', { 'data-grid-column-header--sortable': sortable }]"
    >
        <div class="data-grid-column-header-content">
            <div class="data-grid-column-header-content__title">
                <VIcon v-if="prependIcon">{{ prependIcon }}</VIcon>
                <span>{{ column.title }}</span>
                <VIcon v-if="localized">mdi-translate</VIcon>
            </div>

            <VIcon v-if="sorted">{{ props.getSortIcon(props.column) }}</VIcon>
            <VIcon v-else-if="sortable">mdi-sort</VIcon>
        </div>
    </th>
</template>

<style lang="scss" scoped>
.data-grid-column-header {
    z-index: 90 !important;

    &--sortable {
        cursor: pointer;
    }
}

.data-grid-column-header-content {
    display: flex;
    justify-content: space-between;
    gap: 0.5rem;

    &__title {
        display: flex;
        gap: 0.5rem;
        white-space: nowrap;
    }
}
</style>
