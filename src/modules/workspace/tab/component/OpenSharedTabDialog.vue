<script setup lang="ts">
import { asError } from '@/utils/error'
/**
 * Dialog to open a shared tab from a hash or share link pasted by the user into a running
 * evitaLab session. Resolution mirrors the URL-based shared tab flow (see TabSharedDialog):
 * a warning is shown for the potentially unsafe query, the tab is resolved via the
 * SharedTabResolver and, if the embedded connection is missing locally, the connection
 * troubleshooter is offered.
 */

import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useWorkspaceService, WorkspaceService } from '@/modules/workspace/service/WorkspaceService'
import { SharedTabResolver, useSharedTabResolver } from '@/modules/workspace/tab/service/SharedTabResolver'
import { useToaster } from '@/modules/notification/service/Toaster'
import type { Toaster } from '@/modules/notification/service/Toaster'
import { ShareTabObject } from '@/modules/workspace/tab/model/ShareTabObject'
import { TabDefinition } from '@/modules/workspace/tab/model/TabDefinition'
import { InvalidConnectionInSharedTabError } from '@/modules/workspace/tab/error/InvalidConnectionInSharedTabError'
import type { SharedTabTroubleshooterCallback } from '@/modules/workspace/tab/service/SharedTabTroubleshooterCallback'
import VFormDialog from '@/modules/base/component/VFormDialog.vue'
import TabSharedTroubleshooterDialog from '@/modules/workspace/tab/component/TabSharedTroubleshooterDialog.vue'

const workspaceService: WorkspaceService = useWorkspaceService()
const sharedTabResolver: SharedTabResolver = useSharedTabResolver()
const toaster: Toaster = useToaster()
const { t } = useI18n()

defineProps<{
    modelValue: boolean
}>()
const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
}>()

const hashOrUrl = ref<string>('')

const changed = computed<boolean>(() => hashOrUrl.value.trim().length > 0)
const sharedTab = computed<ShareTabObject | undefined>(() => {
    try {
        return ShareTabObject.fromLinkParamOrUrl(hashOrUrl.value)
    } catch {
        return undefined
    }
})
const hasSensitiveData = computed<boolean>(() => {
    const tabData: any = sharedTab.value?.tabData
    return tabData != undefined && Object.keys(tabData).length > 0
})

const hashOrUrlRules = [
    (value: string): boolean | string => {
        if (value == undefined || value.trim().length === 0) {
            return t('tabShare.openSharedDialog.form.hashOrUrl.validation.required')
        }
        try {
            ShareTabObject.fromLinkParamOrUrl(value)
            return true
        } catch {
            return t('tabShare.openSharedDialog.form.hashOrUrl.validation.invalid')
        }
    }
]

const showSharedTabTroubleshooter = ref<boolean>(false)
const sharedTabOriginalConnectionName = ref<string | undefined>(undefined)
const sharedTabTroubleshooterCallback = ref<SharedTabTroubleshooterCallback | undefined>(undefined)

function reset(): void {
    hashOrUrl.value = ''
}

async function openSharedTab(): Promise<boolean> {
    let shareTabObject: ShareTabObject
    try {
        shareTabObject = ShareTabObject.fromLinkParamOrUrl(hashOrUrl.value)
    } catch (e) {
        await toaster.error('Could not resolve shared tab', asError(e))
        return false
    }

    try {
        const sharedTabRequest: TabDefinition<any, any> = await sharedTabResolver.resolve(shareTabObject)
        workspaceService.createTab(sharedTabRequest)
        return true
    } catch (e) {
        if (e instanceof InvalidConnectionInSharedTabError) {
            showSharedTabTroubleshooter.value = true
            sharedTabOriginalConnectionName.value = e.originalConnectionName
            sharedTabTroubleshooterCallback.value = e.troubleshooterCallback
            return false
        } else {
            await toaster.error('Could not resolve shared tab', asError(e))
            return false
        }
    }
}

function brokenSharedTabFixed(fixedSharedTabRequest: TabDefinition<any, any>): void {
    workspaceService.createTab(fixedSharedTabRequest)
    showSharedTabTroubleshooter.value = false
    reset()
    emit('update:modelValue', false)
}

function brokenSharedTabRejected(): void {
    showSharedTabTroubleshooter.value = false
}
</script>

<template>
    <VFormDialog
        :model-value="modelValue"
        :changed="changed"
        confirm-button-icon="mdi-check"
        :confirm="openSharedTab"
        :reset="reset"
        @update:model-value="emit('update:modelValue', $event)"
    >
        <template #title>
            {{ t('tabShare.openSharedDialog.title') }}
        </template>

        <template #prepend-form>
            <span v-html="t('tabShare.openSharedDialog.text')" />
        </template>

        <template #default>
            <VTextarea
                v-model="hashOrUrl"
                :label="t('tabShare.openSharedDialog.form.hashOrUrl.label')"
                :placeholder="t('tabShare.openSharedDialog.form.hashOrUrl.placeholder')"
                :rules="hashOrUrlRules"
                auto-grow
                rows="3"
                max-rows="8"
                required
                autofocus
            />
        </template>

        <template #append-form>
            <VAlert
                v-if="hasSensitiveData"
                icon="mdi-alert-outline"
                type="warning"
            >
                <span v-html="t('tabShare.sharedDialog.warning.potentiallyUnsafe')" />
            </VAlert>
        </template>

        <template #confirm-button-body>
            {{ t('tabShare.openSharedDialog.button.open') }}
        </template>
    </VFormDialog>

    <TabSharedTroubleshooterDialog
        :model-value="showSharedTabTroubleshooter"
        :original-connection-name="sharedTabOriginalConnectionName"
        :troubleshooter-callback="sharedTabTroubleshooterCallback!"
        @resolve="brokenSharedTabFixed"
        @reject="brokenSharedTabRejected"
    />
</template>

<style lang="scss" scoped>

</style>
