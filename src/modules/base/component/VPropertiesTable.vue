<script setup lang="ts">
import { Property } from '@/modules/base/model/properties-table/Property'
import VPropertiesTableValue from '@/modules/base/component/VPropertiesTableValue.vue'

const props = withDefaults(defineProps<{
    title?: string
    properties: Property[],
    dense?: boolean
}>(), {
    title: undefined,
    dense: false
})
</script>

<template>
    <table class="properties-table">
        <caption v-if="title != undefined" class="text-high-emphasis text-left">{{ title }}</caption>
        <tr
            v-for="property in properties"
            :key="property.name"
            :class="['properties-table__row', { 'properties-table__row--dense': dense }]"
        >
            <td class="text-medium-emphasis">{{ property.name }}</td>
            <td>
                <VPropertiesTableValue :property="property" :property-value="property.value" />
            </td>
        </tr>
    </table>
</template>

<style lang="scss" scoped>
.properties-table {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.5rem;

    &__row {
        display: inline-grid;
        grid-template-columns: 15rem 1fr;
        column-gap: 0.5rem;
        align-items: center;
    }

    &__row--dense {
        grid-template-columns: 8rem 15rem;
    }
}
</style>
