<script setup lang="ts">
/**
 * Dialog window to accept or reject a shared tab.
 */

import { useI18n } from 'vue-i18n'
import { useWorkspaceService, WorkspaceService } from '@/modules/workspace/service/WorkspaceService'
import { TabDefinition } from '@/modules/workspace/tab/model/TabDefinition'
import VLabDialog from '@/modules/base/component/VLabDialog.vue'
import VRejectDialogButton from '@/modules/base/component/VRejectDialogButton.vue'
import VConfirmDialogButton from '@/modules/base/component/VConfirmDialogButton.vue'

const workspaceService: WorkspaceService = useWorkspaceService()
const { t } = useI18n()

const props = defineProps<{
    tabRequest: TabDefinition<any, any>
}>()
const emit = defineEmits<{
    (e: 'resolve'): void
}>()

function acceptSharedTab(): void {
    workspaceService.createTab(props.tabRequest)
    emit('resolve')
}

function rejectSharedTab(): void {
    emit('resolve')
}
</script>

<template>
    <VLabDialog
        :model-value="true"
        max-width="36rem"
        @update:model-value="rejectSharedTab"
    >
        <template #title>
            {{ t('tabShare.sharedDialog.title') }}
        </template>

        <template #default>
            <template v-if="tabRequest.initialData != undefined">
                <span v-html="t('tabShare.sharedDialog.text.withoutInitialData')" />
            </template>
            <template v-else>
                <span v-html="t('tabShare.sharedDialog.text.withInitialData')" />
            </template>

            <VAlert
                v-if="tabRequest.initialData != undefined"
                icon="mdi-alert-outline"
                type="warning"
                class="mt-4"
            >
                <span v-html="t('tabShare.sharedDialog.warning.potentiallyUnsafe')" />
            </VAlert>
        </template>

        <template #reject-button>
            <VRejectDialogButton @reject="rejectSharedTab">
                {{ t('tabShare.sharedDialog.button.reject') }}
            </VRejectDialogButton>
        </template>
        <template #confirm-button>
            <VConfirmDialogButton icon="mdi-check" @confirm="acceptSharedTab">
                {{ t('tabShare.sharedDialog.button.accept') }}
            </VConfirmDialogButton>
        </template>
    </VLabDialog>
</template>

<style lang="scss" scoped>

</style>
