<script setup lang="ts">

import { Property } from '@/modules/base/model/properties-table/Property'
import VPropertiesTable from '@/modules/base/component/VPropertiesTable.vue'

const props = defineProps<{
    properties: Property[]
}>()
</script>

<template>
    <VSheet class="container">
        <VPropertiesTable :properties="properties"/>
        <VExpansionPanels v-if="$slots['nested-details']" multiple class="mt-5">
            <slot name="nested-details"/>
        </VExpansionPanels>
    </VSheet>
</template>

<style lang="scss" scoped>
.container {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    padding: 1rem;
    overflow-y: auto;
}
</style>
