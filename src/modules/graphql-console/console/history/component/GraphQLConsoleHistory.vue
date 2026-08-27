<script setup lang="ts">
/**
 * Query history listing for GraphQL console.
 */

import { computed, ref } from 'vue'
import type {
    GraphQLConsoleHistoryRecord
} from '@/modules/graphql-console/console/history/model/GraphQLConsoleHistoryRecord'
import HistoryComponent from '@/modules/history-component/HistoryComponent.vue';

const props = defineProps<{
    items: GraphQLConsoleHistoryRecord[]
}>()
const emit = defineEmits<{
    (e: 'selectHistoryRecord', value: GraphQLConsoleHistoryRecord): void,
    (e: 'update:clearHistory'): void
}>()

const historyListItems = computed<{ key: string, preview: string[], value: GraphQLConsoleHistoryRecord }[]>(() => {
    return props.items.map((record: GraphQLConsoleHistoryRecord) => {
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
        @select-history-record="(value) => emit('selectHistoryRecord', value)"
        @update:clear-history="emit('update:clearHistory')">
    </HistoryComponent>
</template>

<style lang="scss" scoped>
</style>
