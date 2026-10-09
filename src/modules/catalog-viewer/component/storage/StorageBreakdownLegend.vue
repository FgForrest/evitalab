<script setup lang="ts">
/**
 * Legend of the storage breakdown bar: swatch, label, bytes and share, nested the way the engine's own
 * decomposition nests.
 *
 * Not a `VPropertiesTable`, because a row here carries a swatch and *two* value columns; the properties table has
 * one value column and no swatch.
 */

import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { List as ImmutableList } from 'immutable'
import { StorageBreakdownRow } from '@/modules/catalog-viewer/model/StorageBreakdownRow'
import { formatBytes, formatPercent, share } from '@/modules/catalog-viewer/service/statisticsFormatting'

const { t } = useI18n()

const props = defineProps<{
    rows: ImmutableList<StorageBreakdownRow>
    /**
     * Denominator of the share column — the measured total on disk.
     */
    totalBytes: bigint
}>()

/**
 * Rows regrouped so a nested row travels with the row it belongs under.
 *
 * The legend lays out in two columns, and a flat list would flow row-major — putting "held by the deletion floor"
 * in the left column, beneath whichever unrelated category happens to sit there. Grouping lets the column break
 * fall between categories instead of inside one.
 */
const groups = computed<StorageBreakdownRow[][]>(() => {
    const groups: StorageBreakdownRow[][] = []
    for (const row of props.rows) {
        if (row.depth === 0 || groups.length === 0) {
            groups.push([row])
        } else {
            groups.at(-1)?.push(row)
        }
    }
    return groups
})
</script>

<template>
    <div class="storage-legend">
        <div
            v-for="(group, groupIndex) in groups"
            :key="groupIndex"
            class="storage-legend__group"
        >
            <div
                v-for="(row, index) in group"
                :key="index"
                class="storage-legend__row"
                :style="{ paddingLeft: `${row.depth * 1.25}rem` }"
            >
                <span
                    class="storage-legend__swatch"
                    :style="{ backgroundColor: row.color ?? 'transparent' }"
                />
                <span class="storage-legend__label text-medium-emphasis">
                    {{ row.label }}
                    <!--
                        the tooltip is anchored to the icon, not to the label: the label stretches across the
                        legend's whole text column, and a tooltip centred on that lands next to the byte figure
                        instead of next to the icon it belongs to
                    -->
                    <span class="storage-legend__help">
                        <VIcon icon="mdi-information-outline" size="x-small" />
                        <VTooltip activator="parent">
                            <span>{{ row.description }}</span>
                        </VTooltip>
                    </span>
                </span>
                <span class="storage-legend__bytes">{{ formatBytes(row.bytes) }}</span>
                <span class="storage-legend__share text-disabled">
                    {{ formatPercent(share(row.bytes, totalBytes)) }}
                </span>
            </div>
        </div>
        <div v-if="rows.isEmpty()" class="text-disabled font-italic">
            {{ t('catalogViewer.storage.placeholder.nothingStored') }}
        </div>
    </div>
</template>

<style lang="scss" scoped>
.storage-legend {
    // multi-column rather than grid: the flow is column-major, so a category and the rows nested under it stay
    // together and the break falls between groups
    columns: 22rem 2;
    column-gap: 2rem;

    &__group {
        break-inside: avoid;
    }

    &__row {
        margin-bottom: 0.25rem;
        display: grid;
        grid-template-columns: 0.75rem 1fr auto auto;
        align-items: center;
        column-gap: 0.5rem;
    }

    &__swatch {
        width: 0.75rem;
        height: 0.75rem;
        border-radius: 2px;
    }

    &__label {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        min-width: 0;
    }

    &__help {
        display: inline-flex;
        flex: 0 0 auto;
    }

    &__bytes {
        font-variant-numeric: tabular-nums;
    }

    &__share {
        font-variant-numeric: tabular-nums;
        min-width: 3.5rem;
        text-align: right;
    }
}
</style>
