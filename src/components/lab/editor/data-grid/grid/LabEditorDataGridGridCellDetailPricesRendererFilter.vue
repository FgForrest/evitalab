<script setup lang="ts">
/**
 * Filter component for prices renderer. Used to filter all available entity prices-
 */

import { EntityPrice } from '@/model/editor/data-grid'

const props = defineProps<{
    filterData: {
        priceIds: number[],
        priceLists: string[],
        currencies: string[],
        innerRecordIds: number[]
    },
    filteredAllPrices: EntityPrice[],
    selectedPriceIds: number[],
    selectedPriceLists: string[],
    selectedCurrencies: string[],
    selectedInnerRecordIds: number[]
}>()
const emit = defineEmits<{
    (e: 'update:selectedPriceIds', value: string[]): void,
    (e: 'update:selectedPriceLists', value: string[]): void,
    (e: 'update:selectedCurrencies', value: string[]): void,
    (e: 'update:selectedInnerRecordIds', value: string[]): void
}>()
</script>

<template>
    <div class="price-renderer-all-prices-filter">
        <div class="price-renderer-all-prices-filter__inputs">
            <VCombobox
                :model-value="selectedPriceIds"
                :disabled="filterData.priceIds.length === 0"
                prepend-inner-icon="mdi-identifier"
                label="Price ID"
                :items="filterData.priceIds"
                class="price-renderer-all-prices-filter__select"
                clearable
                multiple
                hide-details
                @update:model-value="emit('update:selectedPriceIds', $event)"
            />
            <VCombobox
                :model-value="selectedPriceLists"
                :disabled="filterData.priceLists.length === 0"
                prepend-inner-icon="mdi-format-list-bulleted"
                label="Price list"
                :items="filterData.priceLists"
                class="price-renderer-all-prices-filter__select"
                clearable
                multiple
                hide-details
                @update:model-value="emit('update:selectedPriceLists', $event)"
            >
                <template #append>
                    <VTooltip>
                        <template #activator="{ props }">
                            <VIcon v-bind="props">mdi-help-circle-outline</VIcon>
                        </template>

                        The order of selected price lists <em>defines the price listing ordering</em>.<br/>
                        It also <em>defines priority</em> of price lists for price for sale computation.
                    </VTooltip>
                </template>
            </VCombobox>
            <VCombobox
                :model-value="selectedCurrencies"
                :disabled="filterData.currencies.length === 0"
                prepend-inner-icon="mdi-currency-usd"
                label="Currency"
                :items="filterData.currencies"
                class="price-renderer-all-prices-filter__select"
                clearable
                multiple
                hide-details
                @update:model-value="emit('update:selectedCurrencies', $event)"
            />
            <VCombobox
                :model-value="selectedInnerRecordIds"
                :disabled="filterData.innerRecordIds.length === 0"
                prepend-inner-icon="mdi-format-list-group"
                label="Inner record IDs"
                :items="filterData.innerRecordIds"
                class="price-renderer-all-prices-filter__select"
                clearable
                multiple
                hide-details
                @update:model-value="emit('update:selectedInnerRecordIds', $event)"
            />
        </div>

        <div v-if="filteredAllPrices.length === 0 || selectedPriceLists.length === 0 || selectedCurrencies.length != 1">
            <VAlert v-if="selectedPriceLists.length === 0 && selectedCurrencies.length === 0" type="info">
                To compute a price for sale for the filtered prices, select at least one price list and one currency.
            </VAlert>
            <VAlert v-else type="warning">
                No price for sale was computed for the filtered prices because
                <template v-if="filteredAllPrices.length === 0">
                    there are no prices left for this filter.
                </template>
                <template v-else-if="selectedPriceLists.length === 0">
                    no price lists are selected.
                </template>
                <template v-else-if="selectedCurrencies.length === 0">
                    no currency is selected.
                </template>
                <template v-else-if="selectedCurrencies.length > 1">
                    more than one currency is selected.
                </template>
            </VAlert>
        </div>
    </div>
</template>

<style lang="scss" scoped>

.price-renderer-all-prices-filter {
    display: flex;
    flex-direction: column;
    gap: 1rem;

    &__inputs {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
    }

    &__select {
        flex: 1;
        min-width: 10rem;
    }
}
</style>
