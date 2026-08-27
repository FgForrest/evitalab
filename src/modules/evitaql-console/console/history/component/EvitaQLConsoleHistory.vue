<script setup lang="ts">
/**
 * Query history listing for EvitaQL console.
 */

import { computed, ref } from 'vue'
import type {
    EvitaQLConsoleHistoryRecord
} from '@/modules/evitaql-console/console/history/model/EvitaQLConsoleHistoryRecord'
import HistoryComponent from '@/modules/history-component/HistoryComponent.vue'

const props = defineProps<{
    items: EvitaQLConsoleHistoryRecord[]
}>()
const emit = defineEmits<{
    (e: 'selectHistoryRecord', value: EvitaQLConsoleHistoryRecord): void,
    (e: 'update:clearHistory'): void
}>()

const historyListItems = computed<{ key: string, preview: string[], value: EvitaQLConsoleHistoryRecord }[]>(() => {
    return props.items.map((record: EvitaQLConsoleHistoryRecord) => {
        return {
            key: record[0],
            preview: record[1]?.split('\n')?.slice(0, 5) || [''],
            value: record
        }
    })
})

// the shared history component is generic, so it has no `InstanceType`; it is referenced by what it exposes
const historyComponentRef = ref<{ focus: () => void } | undefined>()

function focus(): void {
    historyComponentRef.value?.focus()
}

defineExpose<{
    focus: () => void
}>({
    focus
})
</script>

<template>
    <HistoryComponent ref="historyComponentRef"
        :items="historyListItems"
        @select-history-record="(value: EvitaQLConsoleHistoryRecord) => emit('selectHistoryRecord', value)"
        @update:clear-history="emit('update:clearHistory')">
    </HistoryComponent>
</template>

<style lang="scss" scoped>
</style>
