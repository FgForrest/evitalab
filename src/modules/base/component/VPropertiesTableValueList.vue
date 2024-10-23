<script setup lang="ts">
/**
 * Renders the List<PropertyValue> variant
 */

import { List } from 'immutable'
import { PropertyValue } from '@/modules/base/model/properties-table/PropertyValue'
import { Property } from '@/modules/base/model/properties-table/Property'
import { useI18n } from 'vue-i18n'
import VPropertiesTableValueItem from '@/modules/base/component/VPropertiesTableValueItem.vue'

const { t } = useI18n()

const props = defineProps<{
    property: Property,
    propertyValue: List<PropertyValue>
}>()
</script>

<template>
    <VChipGroup dense column>
        <template v-if="(propertyValue as List<PropertyValue>).size > 0">
            <template v-for="item in propertyValue" :key="item.value.toString()">
                <VPropertiesTableValueItem :property="property" :propertyValue="item" />
            </template>
        </template>
        <template v-else>
            <span class="text-disabled font-weight-light font-italic">
                {{ t('common.placeholder.empty') }}
            </span>
        </template>
    </VChipGroup>
</template>

<style lang="scss" scoped>
</style>
