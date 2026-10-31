<script setup lang="ts">
/**
 * Pagination footer of a {@link VDataGrid}: page size selector, range of displayed items and page navigation.
 * Reproduces the markup of Vuetify's `VDataTableFooter`, which cannot be used outside a Vuetify data table.
 */

import 'vuetify/lib/components/VDataTable/VDataTableFooter.css'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { computePageRange } from '@/modules/base/service/data-grid/dataGridPagination'

const { t } = useI18n()

const props = defineProps<{
    page: number,
    pageCount: number,
    itemsPerPage: number,
    itemsPerPageOptions: number[],
    totalCount: number
}>()
const emit = defineEmits<{
    (e: 'update:page', value: number): void
    (e: 'update:itemsPerPage', value: number): void
}>()

const itemsPerPageItems = computed<{ title: string, value: number }[]>(() =>
    props.itemsPerPageOptions.map(it => ({ title: it.toString(10), value: it })))
const pageRange = computed<{ from: number, to: number }>(() =>
    computePageRange(props.page, props.itemsPerPage, props.totalCount))
</script>

<template>
    <div class="v-data-table-footer">
        <div class="v-data-table-footer__items-per-page">
            <span>{{ t('common.dataGrid.itemsPerPage') }}</span>
            <VSelect
                :items="itemsPerPageItems"
                :model-value="itemsPerPage"
                density="compact"
                variant="outlined"
                hide-details
                @update:model-value="emit('update:itemsPerPage', Number($event))"
            />
        </div>
        <div class="v-data-table-footer__info">
            <div>{{ t('common.dataGrid.pageRange', { from: pageRange.from, to: pageRange.to, total: totalCount }) }}</div>
        </div>
        <div class="v-data-table-footer__pagination">
            <VPagination
                :model-value="page"
                :length="pageCount"
                density="comfortable"
                rounded
                show-first-last-page
                :total-visible="0"
                variant="plain"
                :first-aria-label="t('common.dataGrid.firstPage')"
                :prev-aria-label="t('common.dataGrid.previousPage')"
                :next-aria-label="t('common.dataGrid.nextPage')"
                :last-aria-label="t('common.dataGrid.lastPage')"
                @update:model-value="emit('update:page', $event)"
            />
        </div>
    </div>
</template>
