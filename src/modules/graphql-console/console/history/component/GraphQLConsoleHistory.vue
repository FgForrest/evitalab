<script setup lang="ts">
/**
 * Query history listing for GraphQL console.
 */

import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
    GraphQLConsoleHistoryRecord
} from '@/modules/graphql-console/console/history/model/GraphQLConsoleHistoryRecord'

const { t } = useI18n()

const props = defineProps<{
    items: GraphQLConsoleHistoryRecord[]
}>()
const emit = defineEmits<{
    (e: 'selectHistoryRecord', value: GraphQLConsoleHistoryRecord): void,
    (e: 'update:clearHistory'): void
}>()

const historyListRef = ref<HTMLElement | undefined>()
const historyListItems = computed<any[]>(() => {
    return props.items.map((record: GraphQLConsoleHistoryRecord) => {
        return {
            key: record[0],
            preview: record[1]?.split('\n')?.slice(0, 5) || [''],
            value: record
        }
    })
})

/**
 * Focuses the first item in the history list.
 */
function focus() {
    // @ts-ignore
    let firstItem = historyListRef.value?.$el?.querySelector('.v-list-item');
    if (firstItem) {
        firstItem.focus();
    }
}

defineExpose<{
    focus: () => void
}>({
    focus
})
</script>

<template>
    <div class="graphql-editor-history">
        <p v-if="historyListItems.length === 0" class="text-disabled graphql-editor-history__empty-item">
            {{ t('graphQLConsole.placeholder.emptyHistory') }}
        </p>
        <template v-else>
            <VBtn
                prepend-icon="mdi-playlist-remove"
                variant="outlined"
                rounded="xl"
                class="graphql-editor-history__clear-button"
                @click="emit('update:clearHistory')"
            >
                {{ t('graphQLConsole.button.clearHistory') }}
            </VBtn>

            <VList ref="historyListRef" class="graphql-editor-history__list">
                <VListItem
                    v-for="item in historyListItems"
                    :key="item.key"
                    variant="tonal"
                    rounded
                    @click="emit('selectHistoryRecord', item.value)"
                >
                    <VCardText>
                        <template v-for="(line, index) in item.preview" :key="index">
                            {{ line }}<br/>
                        </template>
                    </VCardText>
                </VListItem>
            </VList>
        </template>
    </div>
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
