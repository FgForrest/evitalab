<script setup lang="ts">
/**
 * Represents single item in all entity prices list in price renderer.
 */

import { QueryPriceMode } from '@/model/evitadb'
import { EntityPrice, priceTypeKey } from '@/model/editor/tab/dataGrid/data-grid'
import { mandatoryInject } from '@/helpers/reactivity'
import LabEditorDataGridGridCellDetailPricesRendererPrice
    from '@/components/lab/editor/data-grid/grid/LabEditorDataGridGridCellDetailPricesRendererPrice.vue'
import VMarkdown from '@/components/base/VMarkdown.vue'

const props = withDefaults(defineProps<{
    price: EntityPrice
    priceForSale?: boolean
    virtualPriceForSale?: boolean
}>(), {
    priceForSale: false,
    virtualPriceForSale: false
})
const priceType = mandatoryInject(priceTypeKey)

</script>

<template>
    <VExpansionPanel :key="price.priceId">
        <VExpansionPanelTitle>
            <VTooltip v-if="priceForSale">
                <template #activator="{ props }">
                    <VIcon class="mr-3" v-bind="props">mdi-cart-outline</VIcon>
                </template>

                This price would be used as a price for sale if this filter were used in
                the main query.
            </VTooltip>

            <VTooltip>
                <template #activator="{ props }">
                    <VIcon class="mr-3" v-bind="props">{{ price.sellable ? 'mdi-cash' : 'mdi-cash-off' }}</VIcon>
                </template>

                <template v-if="price.sellable">
                    This price is sellable.
                </template>
                <template v-else>
                    This price is not sellable.
                </template>
            </VTooltip>

            <VChipGroup>
                <VChip v-if="!virtualPriceForSale" prepend-icon="mdi-identifier">
                    <span>
                        {{ price.priceId }}

                        <VTooltip activator="parent">
                            Price ID
                        </VTooltip>
                    </span>
                        <span v-if="price.innerRecordId != undefined">
                        &nbsp;/&nbsp;{{ price.innerRecordId }}

                        <VTooltip activator="parent">
                            Inner record ID
                        </VTooltip>
                    </span>
                </VChip>
                <VChip v-else prepend-icon="mdi-identifier" variant="flat">
                    <span>
                        Virtual

                        <VTooltip activator="parent">
                            <VMarkdown source="This is a virtual price for sale computed based on this filter. The price is virtual because the entity has price inner record handling set to `SUM`, therefore, the price for sale is a sum of internally selected prices."/>
                        </VTooltip>
                    </span>
                </VChip>

                <VChip prepend-icon="mdi-format-list-bulleted">
                    {{ price.priceList }}

                    <VTooltip activator="parent">
                        Price list
                    </VTooltip>
                </VChip>

                <VChip>
                    {{ price.toPreviewString({ priceType }) }}

                    <VTooltip activator="parent">
                        <template v-if="priceType == QueryPriceMode.WithTax">
                            Price with tax
                        </template>
                        <template v-else>
                            Price without tax
                        </template>
                    </VTooltip>
                </VChip>
            </VChipGroup>
        </VExpansionPanelTitle>

        <VExpansionPanelText>
            <LabEditorDataGridGridCellDetailPricesRendererPrice :price="price" />
        </VExpansionPanelText>
    </VExpansionPanel>
</template>

<style lang="scss" scoped>

</style>
