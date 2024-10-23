<script setup lang="ts">
/**
 * Represents single item in all entity prices list in price renderer.
 */

import { useI18n } from 'vue-i18n'
import { EntityPrice } from '@/modules/entity-viewer/viewer/model/entity-property-value/EntityPrice'
import { QueryPriceMode } from '@/modules/entity-viewer/viewer/model/QueryPriceMode'
import VMarkdown from '@/modules/base/component/VMarkdown.vue'
import PricesDetailRendererPrice
    from '@/modules/entity-viewer/viewer/component/entity-grid/detail-renderer/PricesDetailRendererPrice.vue'
import { usePriceType } from '@/modules/entity-viewer/viewer/component/dependencies'

const { t } = useI18n()

const props = withDefaults(defineProps<{
    price: EntityPrice
    priceForSale?: boolean
    virtualPriceForSale?: boolean
}>(), {
    priceForSale: false,
    virtualPriceForSale: false
})
const priceType = usePriceType()

</script>

<template>
    <VExpansionPanel :key="price.priceId">
        <VExpansionPanelTitle>
            <VTooltip v-if="priceForSale">
                <template #activator="{ props }">
                    <VIcon class="mr-3" v-bind="props">mdi-cart-outline</VIcon>
                </template>

                {{ t('entityViewer.grid.priceRenderer.price.help.priceForSale') }}
            </VTooltip>

            <VTooltip>
                <template #activator="{ props }">
                    <VIcon class="mr-3" v-bind="props">{{ price.sellable ? 'mdi-cash' : 'mdi-cash-off' }}</VIcon>
                </template>

                <template v-if="price.sellable">
                    {{ t('entityViewer.grid.priceRenderer.price.tooltip.sellablePrice') }}
                </template>
                <template v-else>
                    {{ t('entityViewer.grid.priceRenderer.price.tooltip.notSellablePrice') }}
                </template>
            </VTooltip>

            <VChipGroup>
                <VChip v-if="!virtualPriceForSale" prepend-icon="mdi-identifier">
                    <span>
                        {{ price.priceId }}

                        <VTooltip activator="parent">
                            {{ t('entityViewer.grid.priceRenderer.price.label.priceId') }}
                        </VTooltip>
                    </span>
                        <span v-if="price.innerRecordId != undefined">
                        &nbsp;/&nbsp;{{ price.innerRecordId }}

                        <VTooltip activator="parent">
                            {{ t('entityViewer.grid.priceRenderer.price.label.innerRecordId') }}
                        </VTooltip>
                    </span>
                </VChip>
                <VChip v-else prepend-icon="mdi-identifier" variant="flat">
                    <span>
                        {{ t('entityViewer.grid.priceRenderer.price.label.virtual' )}}

                        <VTooltip activator="parent">
                            <VMarkdown :source="t('entityViewer.grid.priceRenderer.price.help.virtualPriceForSale')"/>
                        </VTooltip>
                    </span>
                </VChip>

                <VChip prepend-icon="mdi-format-list-bulleted">
                    {{ price.priceList }}

                    <VTooltip activator="parent">
                        {{ t('entityViewer.grid.priceRenderer.price.label.priceList') }}
                    </VTooltip>
                </VChip>

                <VChip>
                    {{ price.toPreviewString({ priceType }) }}

                    <VTooltip activator="parent">
                        <template v-if="priceType === QueryPriceMode.WithTax">
                            {{ t('entityViewer.grid.priceRenderer.price.label.priceWithTax') }}
                        </template>
                        <template v-else>
                            {{ t('entityViewer.grid.priceRenderer.price.label.priceWithoutTax') }}
                        </template>
                    </VTooltip>
                </VChip>
            </VChipGroup>
        </VExpansionPanelTitle>

        <VExpansionPanelText>
            <PricesDetailRendererPrice :price="price" />
        </VExpansionPanelText>
    </VExpansionPanel>
</template>

<style lang="scss" scoped>

</style>
