<script setup lang="ts">

/**
 * Dialog used to confirm dangerous operations. Should not be used directly,
 *  instead use VConfirmDialogButton with dangerous flag.
 */

import VLabDialog from '@/modules/base/component/VLabDialog.vue'

import { useI18n } from 'vue-i18n'
import VRejectDialogButton from '@/modules/base/component/VRejectDialogButton.vue'
import VConfirmDialogButton from '@/modules/base/component/VConfirmDialogButton.vue'
import { DangerousConfirmType } from '@/modules/base/model/dialog/DangerousConfirmType'

const { t } = useI18n()

const props = defineProps<{
    modelValue: boolean,
    confirmIcon: string
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
    (e: 'reject'): void
    (e: 'confirm'): void
}>()

function confirm(): void {
    emit('confirm')
    emit('update:modelValue', false)
}

function reject(): void {
    emit('reject')
    emit('update:modelValue', false)
}
</script>

<template>
    <VLabDialog
        :model-value="modelValue"
        persistent
        max-width="36rem"
    >
        <template #activator="{ props }">
            <slot name="activator" v-bind="{ props }"/>
        </template>

        <template #title>
            <slot name="title">
                {{ t('common.dialog.confirmDialog.title') }}
            </slot>
        </template>

        <template #default>
            <slot name="message">
                {{ t('common.dialog.confirmDialog.message') }}
            </slot>
        </template>

        <template #reject-button>
            <VRejectDialogButton @reject="reject">
                {{ t('common.button.cancel') }}
            </VRejectDialogButton>
        </template>
        <template #confirm-button>
            <VConfirmDialogButton
                :icon="confirmIcon"
                :dangerous="DangerousConfirmType.WithoutConfirmDialog"
                @confirm="confirm"
            >
                <slot name="confirm-button-title">
                    {{ t('common.button.confirm') }}
                </slot>
            </VConfirmDialogButton>
        </template>
    </VLabDialog>
</template>

<style lang="scss" scoped>

</style>
