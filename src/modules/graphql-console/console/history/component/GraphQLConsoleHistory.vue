<script setup lang="ts">
/**
 * Query history listing for GraphQL console.
 */

import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
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
.graphql-editor-history {
    display: flex;
    flex-direction: column;
    gap: 1rem;

    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    overflow-y: auto;

    &__list {
        padding: 0 1.5rem 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    &__empty-item {
        text-align: center;
    }

    &__clear-button {
        align-self: center;
        margin-top: 1.5rem;
    }
}

:deep(.v-list-item) {
    padding: 0;
    padding-inline-start: 0 !important;
    padding-inline-end: 0 !important;
}
</style>
