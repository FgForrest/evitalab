<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { GraphQLConsoleHistoryRecord } from '../graphql-console/console/history/model/GraphQLConsoleHistoryRecord';
import type { EvitaQLConsoleHistoryRecord } from '../evitaql-console/console/history/model/EvitaQLConsoleHistoryRecord';
const { t } = useI18n()

interface HistoryListItem {
    key: string
    preview: string[]
    value: GraphQLConsoleHistoryRecord | EvitaQLConsoleHistoryRecord
}

const props = defineProps<{
    items: HistoryListItem[],
}>()

const emit = defineEmits<{
    (e: 'selectHistoryRecord', value: GraphQLConsoleHistoryRecord | EvitaQLConsoleHistoryRecord): void,
    (e: 'update:clearHistory'): void
}>()

const historyListRef = ref<{ $el?: HTMLElement } | undefined>()

/**
 * Focuses the first item in the history list.
 */
function focus() {
    const firstItem = historyListRef.value?.$el?.querySelector('.v-list-item') as HTMLElement | null
    if (firstItem) {
        firstItem.focus()
    }
}

defineExpose<{
    focus: () => void
}>({
    focus
})
</script>


<template>
    <div :class="props.items.length === 0 ? 'editor-history center' : 'editor-history'">
        <p v-if="props.items.length === 0" class="text-disabled editor-history__empty-item">
            {{ t('historyComponent.placeholder.emptyHistory') }}
        </p>
        <template v-else>
            <VBtn
                prepend-icon="mdi-playlist-remove"
                variant="outlined"
                rounded="xl"
                class="editor-history__clear-button"
                @click="emit('update:clearHistory')"
            >
                {{ t('historyComponent.button.clearHistory') }}
            </VBtn>

            <VList ref="historyListRef" class="editor-history__list">
                <VListItem
                    v-for="(item, index) in props.items"
                    :key="index"
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
.editor-history {
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

.center {
    display: flex;
    justify-content: center;
}
</style>