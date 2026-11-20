<script setup lang="ts">
/**
 * Request history listing for the REST console.
 */

import { computed, ref } from 'vue'
import type { RestConsoleHistoryRecord } from '@/modules/rest-console/console/history/model/RestConsoleHistoryRecord'
import HistoryComponent from '@/modules/history-component/HistoryComponent.vue'

const props = defineProps<{
    items: RestConsoleHistoryRecord[]
}>()
const emit = defineEmits<{
    (e: 'selectHistoryRecord', value: RestConsoleHistoryRecord): void,
    (e: 'update:clearHistory'): void
}>()

const historyListItems = computed<{ key: string, preview: string[], value: RestConsoleHistoryRecord }[]>(() => {
    return props.items.map((record: RestConsoleHistoryRecord) => {
        const preview: string[] = [`${record.method} ${record.resolvedPath}`]
        const firstBodyLine: string | undefined = record.body
            ?.split('\n')
            .map(line => line.trim())
            .find(line => line.length > 0 && line !== '{')
        if (firstBodyLine != undefined) {
            preview.push(firstBodyLine)
        }
        return {
            key: record.id,
            preview,
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
    <HistoryComponent
        ref="historyComponentRef"
        :items="historyListItems"
        @select-history-record="(value) => emit('selectHistoryRecord', value)"
        @update:clear-history="emit('update:clearHistory')"
    />
</template>
