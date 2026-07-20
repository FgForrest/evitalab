<script setup lang="ts">

/**
 * Requests creation of start pointer for history record list. Or its removal.
 */

import { useI18n } from 'vue-i18n'
import VActionTooltip from '@/modules/base/component/VActionTooltip.vue'
import { Command } from '@/modules/keymap/model/Command'

const { t } = useI18n()

defineProps<{
    active: boolean,
    loading: boolean
}>()
const emit = defineEmits<{
    (e: 'moveStartPointerToNewest'): void,
    (e: 'removeStartPointer'): void
}>()

function moveStartPointerToNewest(): void {
    emit('moveStartPointerToNewest')
}

function removeStartPointer(): void {
    emit('removeStartPointer')
}
</script>

<template>
    <template v-if="!active">
        <VBtn icon :loading="loading" density="compact" @click="moveStartPointerToNewest">
            <VIcon>mdi-arrow-expand-down</VIcon>
            <VActionTooltip activator="parent" :command="Command.MutationHistoryViewer_MoveStartPointer">
                {{ t('mutationHistoryViewer.button.moveStartPointerToNewest') }}
            </VActionTooltip>
        </VBtn>
    </template>
    <template v-else>
        <VMenu>
            <template #activator="{ props }">
                <VBtn icon :loading="loading" density="compact" v-bind="props">
                    <VBadge color="success" dot>
                        <VIcon>mdi-arrow-expand-down</VIcon>
                    </VBadge>
                    <VActionTooltip activator="parent" :command="Command.MutationHistoryViewer_MoveStartPointer">
                        {{ t('mutationHistoryViewer.button.modifyStartPointer') }}
                    </VActionTooltip>
                </VBtn>
            </template>
            <template #default>
                <VList>
                    <VListItem prepend-icon="mdi-arrow-expand-down" @click="moveStartPointerToNewest">
                        {{ t('mutationHistoryViewer.button.moveStartPointerToNewest') }}
                    </VListItem>
                    <VListItem prepend-icon="mdi-close" @click="removeStartPointer">
                        {{ t('mutationHistoryViewer.button.removeStartPointer') }}
                    </VListItem>
                </VList>
            </template>
        </VMenu>
    </template>
</template>

<style lang="scss" scoped>

</style>
