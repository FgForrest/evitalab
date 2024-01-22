<script setup lang="ts">
/**
 * Query history listing for EvitaQL console.
 */

import { EvitaQLConsoleHistoryRecord } from '@/model/editor/tab/evitaql-console/history'
import { computed } from 'vue'

const props = defineProps<{
    items: EvitaQLConsoleHistoryRecord[]
}>()
const emit = defineEmits<{
    (e: 'selectHistoryRecord', value: EvitaQLConsoleHistoryRecord): void,
    (e: 'update:clearHistory'): void
}>()

const historyListItems = computed<any[]>(() => {
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
    <div class="evitaql-editor-history">
        <p v-if="historyListItems.length === 0" class="text-disabled evitaql-editor-history__empty-item">
            Empty history
        </p>
        <template v-else>
            <VBtn
                prepend-icon="mdi-playlist-remove"
                variant="outlined"
                rounded="xl"
                class="evitaql-editor-history__clear-button"
                @click="emit('update:clearHistory')"
            >
                Clear history
            </VBtn>

            <VCard
                v-for="item in historyListItems"
                :key="item.key"
                variant="tonal"
                class="evitaql-editor-history__item"
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
.evitaql-editor-history {
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
