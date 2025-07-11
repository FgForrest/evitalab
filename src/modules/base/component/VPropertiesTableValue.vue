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

const isList = computed(() => {
    return List.isList(props.propertyValue)
})
</script>

<template>
    <VPropertiesTableValueList
        v-if="isList"
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
