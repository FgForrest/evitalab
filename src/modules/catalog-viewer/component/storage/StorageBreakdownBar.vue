<script setup lang="ts">
/**
 * Full-width stacked bar of the catalog's disk footprint, one series per top-level category.
 *
 * Only the top-level categories are drawn: the engine's total is their sum *by construction*, so adding the nested
 * awaiting-deletion split would double-count it. The split lives in the legend beneath instead.
 */

import { computed } from 'vue'
import { List as ImmutableList } from 'immutable'
import VueApexCharts from 'vue3-apexcharts'
import { StorageBreakdownRow } from '@/modules/catalog-viewer/model/StorageBreakdownRow'
import { formatBytes, formatPercent, share } from '@/modules/catalog-viewer/service/statisticsFormatting'

const props = defineProps<{
    /**
     * Top-level rows only — every row must carry a color, and their bytes must sum to `totalBytes`.
     */
    rows: ImmutableList<StorageBreakdownRow>
    totalBytes: bigint
}>()

const chartSeries = computed(() =>
    props.rows
        .map((row: StorageBreakdownRow) => ({
            name: row.label,
            color: row.color,
            data: [Number(row.bytes)]
        }))
        .toArray()
)

const chartOptions = computed(() => ({
    chart: {
        type: 'bar',
        stacked: true,
        stackType: '100%',
        sparkline: { enabled: true },
        animations: { enabled: false }
    },
    plotOptions: {
        bar: {
            horizontal: true,
            borderRadius: 4,
            borderRadiusApplication: 'around',
            borderRadiusWhenStacked: 'all'
        }
    },
    dataLabels: { enabled: false },
    fill: { opacity: 1 },
    legend: { show: false },
    tooltip: {
        theme: 'dark',
        custom: () => `
            <div class="storage-breakdown-tooltip">
                <table>
                    <tbody>
                        ${props.rows.map((row: StorageBreakdownRow) => `
                            <tr>
                                <td class="storage-breakdown-tooltip__property-name">${row.label}:</td>
                                <td>${formatBytes(row.bytes)} (${formatPercent(share(row.bytes, props.totalBytes))})</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `
    }
}))
</script>

<template>
    <VueApexCharts
        v-if="totalBytes > 0n"
        type="bar"
        height="56"
        :options="chartOptions"
        :series="chartSeries"
    />
</template>

<style lang="scss" scoped>
:deep(.storage-breakdown-tooltip) {
    padding: 0.5rem;
}

:deep(.storage-breakdown-tooltip__property-name) {
    opacity: 0.8;
    padding-right: 0.5rem;
}
</style>
