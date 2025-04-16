<script setup lang="ts">
/**
 * Dialog window to accept or reject a shared tab.
 */

import { useI18n } from 'vue-i18n'
import { useWorkspaceService, WorkspaceService } from '@/modules/workspace/service/WorkspaceService'
import { TabDefinition } from '@/modules/workspace/tab/model/TabDefinition'
import VLabDialog from '@/modules/base/component/VLabDialog.vue'
import VConfirmDialogButton from '@/modules/base/component/VConfirmDialogButton.vue'
import { SharedTabResolver, useSharedTabResolver } from '@/modules/workspace/tab/service/SharedTabResolver'
import { computed, ref, watch } from 'vue'
import { ShareTabObject } from '@/modules/workspace/tab/model/ShareTabObject'
import { Toaster, useToaster } from '@/modules/notification/service/Toaster'
import { InvalidConnectionInSharedTabError } from '@/modules/workspace/tab/error/InvalidConnectionInSharedTabError'
import { SharedTabTroubleshooterCallback } from '@/modules/workspace/tab/service/SharedTabTroubleshooterCallback'
import TabSharedTroubleshooterDialog from '@/modules/workspace/tab/component/TabSharedTroubleshooterDialog.vue'

const workspaceService: WorkspaceService = useWorkspaceService()
const sharedTabResolver: SharedTabResolver = useSharedTabResolver()
const toaster: Toaster = useToaster()
const { t } = useI18n()

const props = defineProps<{
    modelValue: boolean
}>()
const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
}>()

watch(
    () => props.modelValue,
    (newValue) => {
        if (newValue) {
            const urlSearchParams: URLSearchParams = new URLSearchParams(document.location.search)
            const sharedTabSerialized: string | null = urlSearchParams.get('sharedTab')
            if (sharedTabSerialized != undefined) {
                sharedTab.value = ShareTabObject.fromLinkParam(sharedTabSerialized)
            }
        }
    }
)
const sharedTab = ref<ShareTabObject | undefined>(undefined)
const hasSensitiveData = computed<boolean>(() => {
    if (sharedTab.value == undefined) {
        return false
    }
    return sharedTab.value.tabData != undefined
})

const showSharedTabTroubleshooter = ref<boolean>(false)
const sharedTabOriginalConnectionName = ref<string | undefined>(undefined)
const sharedTabTroubleshooterCallback = ref<SharedTabTroubleshooterCallback | undefined>(undefined)

async function acceptSharedTab(): Promise<void> {
    if (sharedTab.value == undefined) {
        // shouldn't happen, reject it
        return
    }

    try {
        const sharedTabRequest: TabDefinition<any, any> = await sharedTabResolver.resolve(sharedTab.value)
        workspaceService.createTab(sharedTabRequest)

        sharedTabResolved()
    } catch (e: any) {
        if (e instanceof InvalidConnectionInSharedTabError) {
            showSharedTabTroubleshooter.value = true
            sharedTabOriginalConnectionName.value = e.originalConnectionName
            sharedTabTroubleshooterCallback.value = e.troubleshooterCallback
        } else {
            await toaster.error('Could not resolve shared tab', e)
        }
    }
}

function brokenSharedTabFixed(fixedSharedTabRequest: TabDefinition<any, any>): void {
    workspaceService.createTab(fixedSharedTabRequest)
    sharedTabResolved()
}

function brokenSharedTabRejected(): void {
    showSharedTabTroubleshooter.value = false
}

function sharedTabResolved(): void {
    emit('update:modelValue', false)
}

</script>

<template>
    <VLabDialog
        :model-value="modelValue"
        persistent
        max-width="36rem"
    >
        <template #title>
            {{ t('tabShare.sharedDialog.title') }}
        </template>

        <template #default>
            <template v-if="hasSensitiveData">
                <span v-html="t('tabShare.sharedDialog.text.withoutInitialData')" />
            </template>
            <template v-else>
                <span v-html="t('tabShare.sharedDialog.text.withInitialData')" />
            </template>

            <VAlert
                v-if="hasSensitiveData"
                icon="mdi-alert-outline"
                type="warning"
                class="mt-4"
            >
                <span v-html="t('tabShare.sharedDialog.warning.potentiallyUnsafe')" />
            </VAlert>
        </template>

        <template #confirm-button>
            <VConfirmDialogButton icon="mdi-check" @confirm="acceptSharedTab">
                {{ t('common.button.accept') }}
            </VConfirmDialogButton>
        </template>
    </VLabDialog>

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
