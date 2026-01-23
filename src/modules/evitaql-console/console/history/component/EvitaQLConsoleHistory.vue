<script setup lang="ts">
/**
 * Query history listing for EvitaQL console.
 */

import { computed } from 'vue'
import type {
    EvitaQLConsoleHistoryRecord
} from '@/modules/evitaql-console/console/history/model/EvitaQLConsoleHistoryRecord'
import HistoryComponent from '@/modules/history-component/HistoryComponent.vue'

interface HistoryListItem {
    key: string
    preview: string[]
    value: EvitaQLConsoleHistoryRecord
}

const props = defineProps<{
    items: EvitaQLConsoleHistoryRecord[]
}>()
const emit = defineEmits<{
    (e: 'selectHistoryRecord', value: EvitaQLConsoleHistoryRecord): void,
    (e: 'update:clearHistory'): void
}>()

const historyListItems = computed<HistoryListItem[]>(() => {
    return props.items.map((record: EvitaQLConsoleHistoryRecord) => {
        return {
            key: record[0],
            preview: record[1]?.split('\n')?.slice(0, 5) || [''],
            value: record
        }
    })
})
</script>

<template>
    <HistoryComponent :items="historyListItems"
        @select-history-record="(value: EvitaQLConsoleHistoryRecord) => emit('selectHistoryRecord', value)"
        @update:clear-history="emit('update:clearHistory')">
    </HistoryComponent>
</template>

<style lang="scss" scoped>
</style>
