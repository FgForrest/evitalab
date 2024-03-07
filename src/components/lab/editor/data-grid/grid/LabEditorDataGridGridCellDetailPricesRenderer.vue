<script setup lang="ts">
/**
 * Special entity property value renderer for prices.
 */

import { computed, ref, watch } from 'vue'
import {
    EntityPrice,
    EntityPrices,
    EntityPropertyKey,
    EntityPropertyValue,
    gridPropsKey,
    NativeValue,
    queryFilterKey,
    queryLanguageKey,
    selectedEntityKey,
    StaticEntityProperties
} from '@/model/editor/tab/dataGrid/data-grid'
import { Toaster, useToaster } from '@/services/editor/toaster'
import VMarkdown from '@/components/base/VMarkdown.vue'
import LabEditorDataGridGridCellDetailPricesRendererPrice
    from '@/components/lab/editor/data-grid/grid/LabEditorDataGridGridCellDetailPricesRendererPrice.vue'
import { mandatoryInject } from '@/helpers/reactivity'
import { PriceInnerRecordHandling } from '@/model/evitadb'
import VExpansionPanelLazyIterator from '@/components/base/VExpansionPanelLazyIterator.vue'
import { QueryLanguage } from '@/model/lab'
import { DataGridService, useDataGridService } from '@/services/editor/data-grid.service'
import LabEditorDataGridGridCellDetailPricesRendererPriceItem
    from '@/components/lab/editor/data-grid/grid/LabEditorDataGridGridCellDetailPricesRendererPriceItem.vue'
import LabEditorDataGridGridCellDetailPricesRendererFilter
    from '@/components/lab/editor/data-grid/grid/LabEditorDataGridGridCellDetailPricesRendererFilter.vue'
import VPropertiesTable from '@/components/base/VPropertiesTable.vue'
import { KeywordValue, Property, PropertyValue } from '@/model/properties-table'

const priceInPriceListsConstraintPattern = new Map<QueryLanguage, RegExp>([
    [QueryLanguage.EvitaQL, /priceInPriceLists\(\s*((?:['"][A-Za-z0-9_.\-~]*['"])(?:\s*,\s*(?:['"][A-Za-z0-9_.\-~]*['"]))*)/],
    [QueryLanguage.GraphQL, /priceInPriceLists\s*:\s*("[A-Za-z0-9_.\-~]+"|(?:[\s*"[A-Za-z0-9_.\-~]+)"(?:\s*,\s*"[A-Za-z0-9_.\-~]+")*\s*\])/]
])
const constraintPriceListsPattern = new Map<QueryLanguage, RegExp>([
    [QueryLanguage.EvitaQL, /['"]([A-Za-z0-9_.\-~]*)['"]/g],
    [QueryLanguage.GraphQL, /"([A-Za-z0-9_.\-~]+)"/g]
])
const priceInCurrencyConstraintPattern = new Map<QueryLanguage, RegExp>([
    [QueryLanguage.EvitaQL, /priceInCurrency\(\s*['"]([A-Za-z0-9_.\-~]*)['"]\s*\)/],
    [QueryLanguage.GraphQL, /priceInCurrency\s*:\s*([A-Z_]+)/]
])
type FilterData = {
    priceIds: number[],
    priceLists: string[],
    currencies: string[],
    innerRecordIds: number[]
}

const dataGridService: DataGridService = useDataGridService()
const toaster: Toaster = useToaster()

const props = withDefaults(defineProps<{
    value: EntityPropertyValue | EntityPropertyValue[],
    fillSpace?: boolean
}>(), {
    fillSpace: true
})
const gridProps = mandatoryInject(gridPropsKey)
const queryLanguage = mandatoryInject(queryLanguageKey)
const queryFilter = mandatoryInject(queryFilterKey)
const selectedEntity = mandatoryInject(selectedEntityKey)

const priceInnerRecordHandling = computed<PriceInnerRecordHandling>(() => {
    return (selectedEntity[EntityPropertyKey.entity(StaticEntityProperties.PriceInnerRecordHandling).toString()] as EntityPropertyValue)?.value() ?? PriceInnerRecordHandling.Unknown
})
const entityPricingProperties = computed<Property[]>(() => [
    { name: 'Price inner record handling', value: new PropertyValue(new KeywordValue(priceInnerRecordHandling.value)) }
])
const prices = computed<EntityPrices>(() => {
    if (!(props.value instanceof EntityPrices)) {
        toaster.error('Invalid prices object!')
        return new EntityPrices(undefined, [])
    }
    return props.value as EntityPrices
})
const filterData = computed<FilterData>(() => {
    const priceIds: number[] = []
    const priceLists: string[] = []
    const currencies: string[] = []
    const innerRecordIds: number[] = []

    for (const price of prices.value.prices) {
        if (!priceIds.includes(price.priceId)) {
            priceIds.push(price.priceId)
        }
        if (!priceLists.includes(price.priceList)) {
            priceLists.push(price.priceList)
        }
        if (!currencies.includes(price.currency)) {
            currencies.push(price.currency)
        }
        if (price.innerRecordId != undefined && !innerRecordIds.includes(price.innerRecordId)) {
            innerRecordIds.push(price.innerRecordId)
        }
    }

    return {
        priceIds,
        priceLists,
        currencies,
        innerRecordIds
    }
})

const selectedPriceIds = ref<number[]>([])
const selectedPriceLists = ref<string[]>([])
const selectedCurrencies = ref<string[]>([])
const selectedInnerRecordIds = ref<number[]>([])

const computedPriceForSale = ref<EntityPrice | undefined>()
watch([selectedPriceLists, selectedCurrencies], async () => {
    computedPriceForSale.value = undefined
    if (selectedPriceLists.value.length > 0 && selectedCurrencies.value.length === 1) {
        computedPriceForSale.value = await dataGridService.computePriceForSale(
            gridProps.params.dataPointer,
            queryLanguage.value!,
            (selectedEntity[EntityPropertyKey.entity(StaticEntityProperties.PrimaryKey).toString()] as NativeValue).value() as number,
            selectedPriceLists.value,
            selectedCurrencies.value[0]
        )
    }
})

const filteredAllPrices = computed<EntityPrice[]>(() => {
    // note: originally we wanted to do server call here for filtering, but it seems to be really fast in browser (tested on hundreds of prices)
    let filteredPrices: EntityPrice[] = prices.value.prices
        .filter((price) => {
            if (selectedPriceIds.value.length > 0 && !selectedPriceIds.value?.includes(price.priceId)) {
                return false
            }
            if (selectedPriceLists.value.length > 0 && !selectedPriceLists.value?.includes(price.priceList)) {
                return false
            }
            if (selectedCurrencies.value.length > 0 && !selectedCurrencies.value?.includes(price.currency)) {
                return false
            }
            if (selectedInnerRecordIds.value.length > 0 && (price.innerRecordId == undefined || !selectedInnerRecordIds.value?.includes(price.innerRecordId))) {
                return false
            }
            return true
        })

    if (selectedPriceLists.value.length > 0) {
        filteredPrices.sort((a, b) => {
            if (computedPriceForSale.value != undefined) {
                const aForSale: boolean = a.priceId === computedPriceForSale.value!.priceId
                const bForSale: boolean = b.priceId === computedPriceForSale.value!.priceId
                if (aForSale && !bForSale) {
                    return -1
                }
                if (!aForSale && bForSale) {
                    return 1
                }
            }

            const aIndex = selectedPriceLists.value.indexOf(a.priceList)
            const bIndex = selectedPriceLists.value.indexOf(b.priceList)
            return aIndex - bIndex
        })
    }

    return filteredPrices
})

const allPricesPage = ref<number>(1)
watch(filteredAllPrices, () => {
    // reset paging when filter changes
    allPricesPage.value = 1
})

async function preselectFilterFromQuery(): Promise<void> {
    return new Promise(() => {
        const priceLists: string | undefined = priceInPriceListsConstraintPattern.get(queryLanguage.value!)!.exec(queryFilter?.value || '')?.[1]
        const currency: string | undefined = priceInCurrencyConstraintPattern.get(queryLanguage.value!)!.exec(queryFilter?.value || '')?.[1]
        if (priceLists != undefined) {
            const priceListsMatches: IterableIterator<RegExpMatchArray> = priceLists.matchAll(constraintPriceListsPattern.get(queryLanguage.value!)!)
            selectedPriceLists.value = Array.from(priceListsMatches).map((match) => match[1])
        }
        if (currency != undefined) {
            selectedCurrencies.value = [currency]
        }
    })
}
watch(queryFilter, () => {
    preselectFilterFromQuery()
})
preselectFilterFromQuery()
</script>

<template>
    <div class="price-renderer">
        <VPropertiesTable :properties="entityPricingProperties" />

        <div>
            <header>
                <h3>Price for sale</h3>
            </header>

            <VMarkdown v-if="prices.priceForSale == undefined" :source="'No price for sale found. To compute price for sale, following constraints need to be present in the filter: `priceInPriceLists`, `priceInCurrency`.'" />
            <LabEditorDataGridGridCellDetailPricesRendererPrice v-else :price="prices.priceForSale"/>
        </div>

        <div class="price-renderer-all-prices">
            <header>
                <h3>All prices</h3>

                <LabEditorDataGridGridCellDetailPricesRendererFilter
                    :filter-data="filterData"
                    :filtered-all-prices="filteredAllPrices"
                    v-model:selected-price-ids="selectedPriceIds"
                    v-model:selected-price-lists="selectedPriceLists"
                    v-model:selected-currencies="selectedCurrencies"
                    v-model:selected-inner-record-ids="selectedInnerRecordIds"
                />
            </header>

            <VExpansionPanels multiple>
                <!-- virtual price for sale -->
                <LabEditorDataGridGridCellDetailPricesRendererPriceItem
                    v-if="computedPriceForSale != undefined && priceInnerRecordHandling === PriceInnerRecordHandling.Sum"
                    :price="computedPriceForSale"
                    price-for-sale
                    virtual-price-for-sale
                />

                <!-- all prices -->
                <VExpansionPanelLazyIterator
                    v-model:page="allPricesPage"
                    :page-size="10"
                    :items="filteredAllPrices"
                >
                    <template #item="{ item }: { item: EntityPrice }">
                        <LabEditorDataGridGridCellDetailPricesRendererPriceItem
                            :price="item"
                            :price-for-sale="computedPriceForSale != undefined && item.priceId === computedPriceForSale.priceId"
                        />
                    </template>
                </VExpansionPanelLazyIterator>

            </VExpansionPanels>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.price-renderer {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin: 1rem;

    h3 {
        margin-bottom: 1rem;
    }
}

.price-renderer-all-prices {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.array-item__title {
    text-overflow: ellipsis;
    text-wrap: nowrap;
    overflow: hidden;
    padding-right: 1rem;
}
</style>
