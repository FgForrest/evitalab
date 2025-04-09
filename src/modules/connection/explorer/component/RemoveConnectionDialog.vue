<script setup lang="ts">
/**
 * Dialog window to remove user-created connection.
 */

import { useI18n } from 'vue-i18n'
import { ConnectionService, useConnectionService } from '@/modules/connection/service/ConnectionService'
import { Toaster, useToaster } from '@/modules/notification/service/Toaster'
import { Connection } from '@/modules/connection/model/Connection'
import VFormDialog from '@/modules/base/component/VFormDialog.vue'

const connectionService: ConnectionService = useConnectionService()
const toaster: Toaster = useToaster()
const { t } = useI18n()

const props = defineProps<{
    modelValue: boolean
    connection: Connection
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
}>()

async function removeConnection(): Promise<boolean> {
    try {
        connectionService.removeConnection(props.connection.id)
        await toaster.success(t(
            'explorer.connection.remove.notification.connectionRemoved',
            {
                connectionName: props.connection.name
            }
        ))
        return true
    } catch (e: any) {
        await toaster.error(t(
            'explorer.connection.remove.notification.couldNotRemoveConnection',
            {
                connectionName: props.connection.name,
                reason: e.message
            }
        ))
        return false
    }
}
</script>

<template>
    <VFormDialog
        :model-value="modelValue"
        dangerous
        changed
        confirm-button-icon="mdi-delete-outline"
        :confirm="removeConnection"
        @update:model-value="emit('update:modelValue', $event)"
    >
        <template #activator="{ props }">
            <slot name="activator" v-bind="props"/>
        </template>

        <template #title>
            <I18nT keypath="explorer.connection.remove.title">
                <template #connectionName>
                    <strong>{{ connection.name }}</strong>
                </template>
            </I18nT>
        </template>

        <template #prepend-form>
            {{ t('explorer.connection.remove.question') }}
        </template>

        <template #confirm-button-body>
            {{ t('common.button.remove') }}
        </template>
    </VFormDialog>
</template>

<style lang="scss" scoped>

</style>
