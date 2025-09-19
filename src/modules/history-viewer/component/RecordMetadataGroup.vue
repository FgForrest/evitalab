<script setup lang="ts">

import { computed } from 'vue'
import type { Ref } from 'vue'
import { useToaster } from '@/modules/notification/service/Toaster'
import type { Toaster } from '@/modules/notification/service/Toaster'
import {
    defaultMetadataGroupIdentifier,
    type MetadataGroup
} from '@/modules/history-viewer/model/MutationHistoryItemVisualisationDefinition.ts'
import {
    MutationHistoryMetadataItemContext
} from '@/modules/history-viewer/model/MutationHistoryMetadataItemContext.ts'
import type { MutationHistoryCriteria } from '@/modules/history-viewer/model/MutationHistoryCriteria.ts'
import { useHistoryCriteria } from '@/modules/history-viewer/component/dependencies.ts'

const toaster: Toaster = useToaster()

const props = defineProps<{
    group: MetadataGroup
}>()

const historyCriteria: Ref<MutationHistoryCriteria> = useHistoryCriteria()

const withHeader = computed<boolean>(() => props.group.identifier !== defaultMetadataGroupIdentifier)
const ctx = computed<MutationHistoryMetadataItemContext>(() => {
    return new MutationHistoryMetadataItemContext(toaster, historyCriteria)
})
</script>

<template>
    <div :class="['record-metadata-group', { 'record-metadata-group--with-header': withHeader }]">
        <VTooltip v-if="withHeader">
            <template #activator="{ props }">
                <span class="record-metadata-group__header" v-bind="props">
                    <VIcon>{{ group.icon }}</VIcon>
                    <span v-if="group.title != undefined">{{ group.title }}:</span>
                </span>
            </template>
            <template #default>
                {{ group.tooltip }}
            </template>
        </VTooltip>

        <div class="record-metadata-group__items">
            <RecordMetadataItem
                v-for="(metadataItem, index) in group.items"
                :key="index"
                :item="metadataItem"
                :ctx="ctx"
            />
        </div>
    </div>
</template>

<style lang="scss" scoped>
.record-metadata-group {
    display: grid;
    grid-template-columns: 1fr;
    column-gap: 0.75rem;
    justify-items: start;
    align-items: center;

    &--with-header {
        grid-template-columns: auto 1fr;
    }

    &__header {
        display: flex;
        column-gap: 0.25rem;
        align-items: center;
    }

    &__items {
        // simulation of proper VChipGroup
        display: flex;
        padding: 0.25rem 0;
        gap: 0.5rem;
        flex-wrap: wrap;
    }
}
</style>
