<script setup lang="ts">

import { EntityPrice } from '@/model/editor/tab/dataGrid/data-grid'
import VPropertiesTable from '@/components/base/VPropertiesTable.vue'
import { computed } from 'vue'
import { KeywordValue, Property, PropertyValue, RangeValue } from '@/model/properties-table'

const props = defineProps<{
    price: EntityPrice
}>()

const properties = computed<Property[]>(() => {
    const priceFormatter = new Intl.NumberFormat(
        navigator.language,
        { minimumFractionDigits: 2, maximumFractionDigits: 2 }
    )
    const taxFormatter = new Intl.NumberFormat(
        navigator.language,
        { style: 'percent', maximumFractionDigits: 0 }
    )

    return [
        { name: 'Price ID', value: new PropertyValue(props.price.priceId) },
        { name: 'Price list', value: new PropertyValue(new KeywordValue(props.price.priceList)) },
        { name: 'Currency', value: new PropertyValue(new KeywordValue(props.price.currency)) },
        { name: 'Inner record ID', value: new PropertyValue(props.price.innerRecordId) },
        { name: 'Sellable', value: new PropertyValue(props.price.sellable) },
        { name: 'Validity', value: new PropertyValue(new RangeValue(props.price.validity)) },
        { name: 'Price without tax', value: new PropertyValue(priceFormatter.format(parseFloat(props.price.priceWithoutTax))) },
        { name: 'Price with tax', value: new PropertyValue(priceFormatter.format(parseFloat(props.price.priceWithTax))) },
        { name: 'Tax rate', value: new PropertyValue(new KeywordValue(taxFormatter.format(parseFloat(props.price.taxRate) / 100))) }
    ]
})
</script>

<template>
    <VPropertiesTable :properties="properties" class="price-table"/>
</template>

<style lang="scss" scoped>
.price-table {
    table, th, td {
        border: none !important;
    }
}
</style>
