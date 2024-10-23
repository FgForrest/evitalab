<script setup lang="ts">
/**
 * Filter component for prices renderer. Used to filter all available entity prices-
 */

import { useI18n } from 'vue-i18n'
import { EntityPrice } from '@/modules/entity-viewer/viewer/model/entity-property-value/EntityPrice'

const { t } = useI18n()

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
    (e: 'update:selectedPriceIds', value: number[]): void,
    (e: 'update:selectedPriceLists', value: string[]): void,
    (e: 'update:selectedCurrencies', value: string[]): void,
    (e: 'update:selectedInnerRecordIds', value: number[]): void
}>()
</script>

<template>
    <div class="price-renderer-all-prices-filter">
        <div class="price-renderer-all-prices-filter__inputs">
            <VAutocomplete
                :model-value="selectedPriceIds"
                :disabled="filterData.priceIds.length === 0"
                prepend-inner-icon="mdi-identifier"
                :label="t('entityViewer.grid.priceRenderer.filter.label.priceId')"
                :items="filterData.priceIds"
                class="price-renderer-all-prices-filter__select"
                clearable
                multiple
                hide-details
                @update:model-value="emit('update:selectedPriceIds', $event)"
            />
            <VAutocomplete
                :model-value="selectedPriceLists"
                :disabled="filterData.priceLists.length === 0"
                prepend-inner-icon="mdi-format-list-bulleted"
                :label="t('entityViewer.grid.priceRenderer.filter.label.priceList')"
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

                        <span v-html="t('entityViewer.grid.priceRenderer.filter.help.priceListOrder')" />
                    </VTooltip>
                </template>
            </VAutocomplete>
            <VAutocomplete
                :model-value="selectedCurrencies"
                :disabled="filterData.currencies.length === 0"
                prepend-inner-icon="mdi-currency-usd"
                :label="t('entityViewer.grid.priceRenderer.filter.label.currency')"
                :items="filterData.currencies"
                class="price-renderer-all-prices-filter__select"
                clearable
                multiple
                hide-details
                @update:model-value="emit('update:selectedCurrencies', $event)"
            />
            <VAutocomplete
                :model-value="selectedInnerRecordIds"
                :disabled="filterData.innerRecordIds.length === 0"
                prepend-inner-icon="mdi-format-list-group"
                :label="t('entityViewer.grid.priceRenderer.filter.label.innerRecordIds')"
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
                {{ t('entityViewer.grid.priceRenderer.filter.help.missingPriceListsAndCurrencyForPriceForSale') }}
            </VAlert>
            <VAlert v-else type="warning">
                <I18nT keypath="entityViewer.grid.priceRenderer.filter.help.noPriceForSale.text">
                    <template #reason>
                        <template v-if="filteredAllPrices.length === 0">
                            {{ t('entityViewer.grid.priceRenderer.filter.help.noPriceForSale.reason.noPrices') }}
                        </template>
                        <template v-else-if="selectedPriceLists.length === 0">
                            {{ t('entityViewer.grid.priceRenderer.filter.help.noPriceForSale.reason.noPriceLists') }}
                        </template>
                        <template v-else-if="selectedCurrencies.length === 0">
                            {{ t('entityViewer.grid.priceRenderer.filter.help.noPriceForSale.reason.noCurrency') }}
                        </template>
                        <template v-else-if="selectedCurrencies.length > 1">
                            {{ t('entityViewer.grid.priceRenderer.filter.help.noPriceForSale.reason.tooManyCurrencies') }}
                        </template>
                    </template>
                </I18nT>
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
