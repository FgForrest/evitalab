<script setup lang="ts">

import { Property } from '@/modules/base/model/properties-table/Property'
import { PropertyValue } from '@/modules/base/model/properties-table/PropertyValue'
import { List } from 'immutable'
import VPropertiesTableValueList from '@/modules/base/component/VPropertiesTableValueList.vue'
import VPropertiesTableValueItem from '@/modules/base/component/VPropertiesTableValueItem.vue'

const props = defineProps<{
    property: Property,
    propertyValue: PropertyValue | List<PropertyValue>
}>()
</script>

<template>
    <VPropertiesTableValueList
        v-if="propertyValue instanceof List"
        :property="property"
        :property-value="propertyValue as List<PropertyValue>"
    />
    <VPropertiesTableValueItem
        v-else
        :property="property"
        :property-value="propertyValue as PropertyValue"
    />
</template>

<style lang="scss" scoped>

</style>
