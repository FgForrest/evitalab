<script setup lang="ts">
/**
 * Dialog to share the current tab and its data with other users via a link pointing to the same evitaLab
 * instance.
 */

import { computed } from 'vue'
import { UnexpectedError } from '@/model/lab'
import {
    SerializableTabRequestComponentData,
    SerializableTabRequestComponentParams
} from '@/model/editor/editor'
import { Toaster, useToaster } from '@/services/editor/toaster'
import { ShareTabObject } from '@/model/editor/tab/share-tab-object'

import { TabType } from '@/model/editor/tab/tab-type'

/**
 * Smallest possible number of characters in a URL valid across all browser. Usually browser support more characters.
 */
const urlCharacterLimit: number = 2083

const toaster: Toaster = useToaster()

const props = defineProps<{
    modelValue: boolean,
    tabType: TabType,
    tabParams: SerializableTabRequestComponentParams<any>,
    tabData: SerializableTabRequestComponentData<any> | undefined
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
        toaster.info('Link copied to clipboard.')
    }).catch(() => {
        toaster.error(new UnexpectedError(undefined, 'Failed to copy to clipboard.'))
    })

    emit('update:modelValue', false)
}
</script>

<template>
    <VDialog
        :model-value="modelValue"
        @update:model-value="$emit('update:modelValue', $event)"
        max-width="36rem"
    >
        <template #activator="{ props }">
            <slot name="activator" v-bind="props"/>
        </template>

        <VCard class="py-8 px-4">
            <VCardTitle>Share this tab</VCardTitle>

            <VCardText>
                You can share this tab and its data with other users via a link. This link will open a new instance of
                evitaLab on their device and load this tab with the same query, which should give the same output as you see now.
            </VCardText>
            <VCardText v-if="tabData != undefined">
                <VAlert icon="mdi-alert-outline" type="warning">
                    Be <em>careful</em> if you have sensitive data in the query, you are giving them away embedded in the
                    link. Once you send the link, you lose control over it and it can be opened by <em>anyone</em> who has
                    access to this evitaLab instance.
                </VAlert>
            </VCardText>
            <VCardText v-if="link.length > urlCharacterLimit">
                <VAlert type="warning" icon="mdi-alert-outline">
                    The link may <em>not</em> work in certain browsers due to its length exceeding {{ urlCharacterLimit }} characters.
                </VAlert>
            </VCardText>

            <VCardActions class="px-6">
                <VSpacer/>
                <VBtn
                    variant="tonal"
                    @click="cancel">
                    Cancel
                </VBtn>
                <VBtn
                    prepend-icon="mdi-content-copy"
                    @click="copyLink"
                    class="ml-4"
                >
                    Copy link
                </VBtn>
            </VCardActions>
        </VCard>
    </VDialog>
</template>

<style lang="scss" scoped>

</style>
