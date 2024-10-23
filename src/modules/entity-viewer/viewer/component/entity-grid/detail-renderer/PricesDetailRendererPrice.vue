<script setup lang="ts">

import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { EntityPrice } from '@/modules/entity-viewer/viewer/model/entity-property-value/EntityPrice'
import { Property } from '@/modules/base/model/properties-table/Property'
import { PropertyValue } from '@/modules/base/model/properties-table/PropertyValue'
import { KeywordValue } from '@/modules/base/model/properties-table/KeywordValue'
import { RangeValue } from '@/modules/base/model/properties-table/RangeValue'
import VPropertiesTable from '@/modules/base/component/VPropertiesTable.vue'

const { t } = useI18n()

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
        new Property(
            t('entityViewer.grid.priceRenderer.price.label.priceId'),
            new PropertyValue(props.price.priceId)
        ),
        new Property(
            t('entityViewer.grid.priceRenderer.price.label.priceList'),
            new PropertyValue(new KeywordValue(props.price.priceList))
        ),
        new Property(
            t('entityViewer.grid.priceRenderer.price.label.currency'),
            new PropertyValue(new KeywordValue(props.price.currency.code))
        ),
        new Property(
            t('entityViewer.grid.priceRenderer.price.label.innerRecordId'),
            new PropertyValue(props.price.innerRecordId)
        ),
        new Property(
            t('entityViewer.grid.priceRenderer.price.label.sellable'),
            new PropertyValue(props.price.sellable)
        ),
        new Property(
            t('entityViewer.grid.priceRenderer.price.label.validity'),
            new PropertyValue(new RangeValue(props.price.validity ?? undefined))
        ),
        new Property(
            t('entityViewer.grid.priceRenderer.price.label.priceWithoutTax'),
            new PropertyValue(priceFormatter.format(parseFloat(props.price.priceWithoutTax?.value ?? '0')))
        ),
        new Property(
            t('entityViewer.grid.priceRenderer.price.label.priceWithTax'),
            new PropertyValue(priceFormatter.format(parseFloat(props.price.priceWithTax.value ?? '0')))
        ),
        new Property(
            t('entityViewer.grid.priceRenderer.price.label.taxRate'),
            new PropertyValue(new KeywordValue(taxFormatter.format(parseFloat(props.price.taxRate?.value ?? '0') / 100)))
        )
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
