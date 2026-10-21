<script setup lang="ts">
/**
 * Status-bar indicator of the symbol search index: a small spinner while catalogs are being indexed, and a warning
 * while the index is truncated at the symbol limit. Renders nothing otherwise. Reads the service state only — no
 * server calls, no error handling needed.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { SymbolSearchService, useSymbolSearchService } from '@/modules/symbol-search/service/SymbolSearchService'
import { type SymbolIndexState, SymbolIndexStatus } from '@/modules/symbol-search/model/SymbolIndexState'
import { maxIndexedSymbols } from '@/modules/symbol-search/service/SymbolIndex'

const symbolSearchService: SymbolSearchService = useSymbolSearchService()
const { t } = useI18n()

const indexState = symbolSearchService.state

const truncated = computed<boolean>(() => indexState.value.status === SymbolIndexStatus.LimitExceeded)

const tooltip = computed<string>(() => {
    const state: SymbolIndexState = indexState.value
    if (state.building) {
        return t('symbolSearch.statusBar.indexing', {
            catalogName: state.currentCatalog ?? '',
            done: state.builtCatalogs,
            total: state.catalogsToBuild
        })
    }
    return t('symbolSearch.statusBar.truncated', { count: state.truncatedCatalogs, limit: maxIndexedSymbols })
})
</script>

<template>
    <div v-if="indexState.building || truncated" class="symbol-index-indicator">
        <VProgressCircular
            v-if="indexState.building"
            indeterminate
            size="12"
            width="2"
            color="primary-lightest"
        />
        <VIcon
            v-else
            icon="mdi-alert-outline"
            color="warning"
            size="small"
        />
        <VTooltip activator="parent">{{ tooltip }}</VTooltip>
    </div>
</template>

<style scoped lang="scss">
.symbol-index-indicator {
    display: flex;
    align-items: center;
}
</style>
