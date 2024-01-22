<script setup lang="ts">
/**
 * Query history listing for GraphQL console.
 */

import { GraphQLConsoleHistoryRecord } from '@/model/editor/tab/graphql-console/history'
import { computed } from 'vue'

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
    <div class="graphql-editor-history">
        <p v-if="historyListItems.length === 0" class="text-disabled graphql-editor-history__empty-item">
            Empty history
        </p>
        <template v-else>
            <VBtn
                prepend-icon="mdi-playlist-remove"
                variant="outlined"
                rounded="xl"
                class="graphql-editor-history__clear-button"
                @click="emit('update:clearHistory')"
            >
                Clear history
            </VBtn>

            <VCard
                v-for="item in historyListItems"
                :key="item.key"
                variant="tonal"
                class="graphql-editor-history__item"
                @click="emit('selectHistoryRecord', item.value)"
            >
                <VCardText>
                    <template v-for="(line, index) in item.preview" :key="index">
                        {{ line }}<br/>
                    </template>
                </VCardText>
            </VCard>
        </template>
    </div>
</template>

<style lang="scss" scoped>
.graphql-editor-history {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1.5rem;

    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    overflow-y: auto;

    &__item {
        flex-shrink: 0;
    }

    &__empty-item {
        text-align: center;
    }

    &__clear-button {
        align-self: center;
    }
}
</style>
