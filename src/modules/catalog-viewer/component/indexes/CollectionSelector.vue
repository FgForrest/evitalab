<script setup lang="ts">
/**
 * Picks which owner's indexes the page describes: one entity collection, or the catalog itself.
 *
 * The catalog is a first-class choice rather than a special case — it holds indexes of its own (the global unique
 * attribute indexes, one per scope), reached through the *same* two calls with no entity type.
 */

import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { List as ImmutableList } from 'immutable'
import { CollectionInfo } from '@/modules/database-driver/request-response/statistics/CollectionInfo'
import { formatNumber } from '@/modules/catalog-viewer/service/statisticsFormatting'

const { t } = useI18n()

const props = defineProps<{
    collections: ImmutableList<CollectionInfo> | undefined
    /**
     * Selected entity type, or `undefined` for the catalog's own indexes.
     */
    modelValue: string | undefined
    /**
     * Index count to badge each chip with, keyed by entity type. A key with no entry renders no badge — the count
     * is not known yet, which is not the same as zero.
     */
    counts?: ReadonlyMap<string, number>
    /**
     * Count badge of the catalog chip.
     */
    catalogCount?: number
}>()
const emit = defineEmits<{
    (e: 'update:modelValue', value: string | undefined): void
}>()

/**
 * Sentinel value of the catalog chip inside the chip group; `undefined` cannot be a `VChip` value.
 */
const catalogValue: string = '__catalog__'

/**
 * Collections ordered by index count, most indexes first, so the chips lead with the collections worth looking at.
 *
 * A collection with no count yet sorts last rather than as a zero, and `Array.sort` is stable, so those keep the
 * server's own order among themselves. Where no counts are supplied at all — the Memory page passes none — the
 * inventory order is left untouched instead of being replaced by an order the page cannot justify.
 */
const orderedCollections = computed<CollectionInfo[]>(() => {
    const collections: CollectionInfo[] = (props.collections ?? ImmutableList<CollectionInfo>()).toArray()
    const counts: ReadonlyMap<string, number> | undefined = props.counts
    if (counts == undefined) {
        return collections
    }
    return collections.sort((left: CollectionInfo, right: CollectionInfo) =>
        (counts.get(right.entityType) ?? -1) - (counts.get(left.entityType) ?? -1)
    )
})

function select(value: unknown): void {
    emit('update:modelValue', value === catalogValue ? undefined : value as string)
}
</script>

<template>
    <!--
        outlined is the variant of an actionable chip in this application - these chips select the described owner,
        so they carry the outline, its hover feedback and its selected state; the group's own `selected-class` is
        deliberately not overridden, because that would drop the `v-chip--selected` class the global chip styles
        highlight the selection with
    -->
    <VChipGroup
        :model-value="modelValue ?? catalogValue"
        variant="outlined"
        mandatory
        column
        @update:model-value="select"
    >
        <VChip :value="catalogValue" prepend-icon="mdi-earth" size="small">
            {{ t('catalogViewer.indexes.selector.catalogIndexes') }}
            <span v-if="catalogCount != undefined" class="collection-selector__count text-disabled">
                {{ formatNumber(catalogCount) }}
            </span>
            <VTooltip activator="parent">
                {{ t('catalogViewer.indexes.selector.help.catalogIndexes') }}
            </VTooltip>
        </VChip>
        <VChip
            v-for="collection in orderedCollections"
            :key="collection.entityType"
            :value="collection.entityType"
            size="small"
        >
            {{ collection.entityType }}
            <span
                v-if="counts?.get(collection.entityType) != undefined"
                class="collection-selector__count text-disabled"
            >
                {{ formatNumber(counts.get(collection.entityType)) }}
            </span>
        </VChip>
    </VChipGroup>
</template>

<style lang="scss" scoped>
.collection-selector__count {
    margin-left: 0.375rem;
    font-variant-numeric: tabular-nums;
}
</style>
