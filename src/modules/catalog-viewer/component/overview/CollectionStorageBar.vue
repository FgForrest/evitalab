<script setup lang="ts">
/**
 * Mini stacked bar splitting one collection's footprint into live data and reclaimable waste.
 *
 * Reclaimable waste is not lost space — compaction gives it back — so it is drawn in `warning` beside the live
 * bytes rather than as an error.
 */

import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import VueApexCharts from 'vue3-apexcharts'
import { formatBytes, formatPercent, share } from '@/modules/catalog-viewer/service/statisticsFormatting'

const { t } = useI18n()

const props = withDefaults(defineProps<{
    liveBytes: bigint
    wasteBytes: bigint
    height?: number
}>(), {
    height: 44
})

const total = computed<bigint>(() => props.liveBytes + props.wasteBytes)

const chartSeries = computed(() => [
    {
        name: t('catalogViewer.storage.label.liveData'),
        color: '#21BFE3',
        data: [Number(props.liveBytes)]
    },
    {
        name: t('catalogViewer.storage.label.reclaimableWaste'),
        color: '#f7a729',
        data: [Number(props.wasteBytes)]
    }
])

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
    dataLabels: {
        enabled: true,
        formatter: (_value: number, { seriesIndex }: { seriesIndex: number }) =>
            formatBytes(seriesIndex === 0 ? props.liveBytes : props.wasteBytes),
        style: { fontSize: '11px' }
    },
    fill: { opacity: 1 },
    xaxis: { categories: [t('catalogViewer.storage.label.total')] },
    legend: { show: false },
    tooltip: {
        theme: 'dark',
        custom: () => `
            <div class="storage-bar-tooltip">
                <table>
                    <tbody>
                        <tr>
                            <td class="storage-bar-tooltip__property-name">${t('catalogViewer.storage.label.liveData')}:</td>
                            <td>${formatBytes(props.liveBytes)} (${formatPercent(share(props.liveBytes, total.value))})</td>
                        </tr>
                        <tr>
                            <td class="storage-bar-tooltip__property-name">${t('catalogViewer.storage.label.reclaimableWaste')}:</td>
                            <td>${formatBytes(props.wasteBytes)} (${formatPercent(share(props.wasteBytes, total.value))})</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `
    }
}))
</script>

<template>
    <VueApexCharts
        v-if="total > 0n"
        type="bar"
        :height="height"
        :options="chartOptions"
        :series="chartSeries"
    />
    <span v-else class="text-disabled font-italic">{{ t('catalogViewer.storage.placeholder.nothingStored') }}</span>
</template>

<style lang="scss" scoped>
:deep(.storage-bar-tooltip) {
    padding: 0.5rem;
}

:deep(.storage-bar-tooltip__property-name) {
    opacity: 0.8;
    padding-right: 0.5rem;
}
</style>
