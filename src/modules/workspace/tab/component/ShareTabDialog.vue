<script setup lang="ts">
/**
 * Dialog to share the current tab and its data with other users via a link pointing to the same evitaLab
 * instance.
 */

import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Toaster, useToaster } from '@/modules/notification/service/Toaster'
import { TabType } from '@/modules/workspace/tab/model/TabType'
import { TabParams } from '@/modules/workspace/tab/model/TabParams'
import { TabData } from '@/modules/workspace/tab/model/TabData'
import { ShareTabObject } from '@/modules/workspace/tab/model/ShareTabObject'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import VLabDialog from '@/modules/base/component/VLabDialog.vue'
import VRejectDialogButton from '@/modules/base/component/VRejectDialogButton.vue'
import VConfirmDialogButton from '@/modules/base/component/VConfirmDialogButton.vue'

/**
 * Smallest possible number of characters in a URL valid across all browser. Usually browser support more characters.
 */
const urlCharacterLimit: number = 2083

const toaster: Toaster = useToaster()
const { t } = useI18n()

const props = defineProps<{
    modelValue: boolean,
    tabType: TabType,
    tabParams: TabParams<any>,
    tabData: TabData<any> | undefined
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
}>()

const evitaLabInstance = computed<string>(() => {
    const location = window.location
    return location.origin + location.pathname
})
const link = computed<string>(() => {
    const shareTabObject: ShareTabObject = new ShareTabObject(props.tabType, props.tabParams.toSerializable(), props.tabData?.toSerializable())
    return `${evitaLabInstance.value}?sharedTab=${shareTabObject.toLinkParam()}`
})

function cancel(): void {
    emit('update:modelValue', false)
}

function copyLink(): void {
    navigator.clipboard.writeText(link.value).then(() => {
        toaster.info(t('tabShare.shareDialog.notification.linkCopied'))
    }).catch(() => {
        toaster.error(new UnexpectedError(t('common.notification.failedToCopyToClipboard')))
    })

    emit('update:modelValue', false)
}
</script>

<template>
    <VLabDialog
        :model-value="modelValue"
        @update:model-value="$emit('update:modelValue', $event)"
        max-width="36rem"
    >
        <template #activator="{ props }">
            <slot name="activator" v-bind="props"/>
        </template>

        <template #title>
            {{ t('tabShare.shareDialog.title') }}
        </template>

        <template #default>
            <div>{{ t('tabShare.shareDialog.text') }}</div>

            <VAlert
                v-if="tabData != undefined"
                icon="mdi-alert-outline"
                type="warning"
                class="mt-4"
            >
                <span v-html="t('tabShare.shareDialog.warning.sensitiveData')" />
            </VAlert>
            <VAlert
                v-if="link.length > urlCharacterLimit"
                type="warning"
                icon="mdi-alert-outline"
                class="mt-4"
            >
                <span v-html="t('tabShare.shareDialog.warning.linkMayNotWork', { urlCharacterLimit })" />
            </VAlert>
        </template>

        <template #reject-button>
            <VRejectDialogButton @reject="cancel">
                {{ t('common.button.cancel') }}
            </VRejectDialogButton>
        </template>
        <template #confirm-button>
            <VConfirmDialogButton icon="mdi-content-copy" @confirm="copyLink">
                {{ t('tabShare.shareDialog.button.copyLink') }}
            </VConfirmDialogButton>
        </template>
    </VLabDialog>
</template>

<style lang="scss" scoped>

</style>
