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

const historyListItems = computed<any[]>(() => {
    return props.items.map((record: GraphQLConsoleHistoryRecord) => {
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
        @select-history-record="(value) => emit('selectHistoryRecord', value)"
        @update:clear-history="emit('update:clearHistory')">
    </HistoryComponent>
</template>

<style lang="scss" scoped>
</style>
