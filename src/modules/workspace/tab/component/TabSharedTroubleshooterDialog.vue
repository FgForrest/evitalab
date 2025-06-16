<script setup lang="ts">

import VFormDialog from '@/modules/base/component/VFormDialog.vue'
import { useI18n } from 'vue-i18n'
import type { ConnectionId } from '@/modules/connection/model/ConnectionId'
import { computed, ref, watch } from 'vue'
import { ConnectionService, useConnectionService } from '@/modules/connection/service/ConnectionService'
import { Connection } from '@/modules/connection/model/Connection'
import type { SharedTabTroubleshooterCallback } from '@/modules/workspace/tab/service/SharedTabTroubleshooterCallback'
import { TabDefinition } from '@/modules/workspace/tab/model/TabDefinition'
import { useToaster } from '@/modules/notification/service/Toaster'
import type { Toaster } from '@/modules/notification/service/Toaster'

const connectionService: ConnectionService = useConnectionService()
const toaster: Toaster = useToaster()
const { t } = useI18n()

const props = withDefaults(defineProps<{
    modelValue: boolean,
    originalConnectionName?: string,
    troubleshooterCallback?: SharedTabTroubleshooterCallback
}>(), {
    originalConnectionName: undefined,
    troubleshooterCallback: undefined
})
const emit = defineEmits<{
    (e: 'resolve', value: TabDefinition<any, any>): void,
    (e: 'reject'): void
}>()

const availableConnections = ref<Connection[]>([])
const availableConnectionsLoaded = ref<boolean>(false)
const newConnectionId = ref<ConnectionId | undefined>(undefined)
const connectionMatchedByName = ref<boolean>(false)

const changed = computed<boolean>(() =>
    newConnectionId.value != undefined && newConnectionId.value.trim().length > 0)

watch(
    () => props.modelValue,
    (newValue) => {
        if (newValue) {
            const connection: Connection = connectionService.getConnection()

            availableConnections.value = [connection]
            availableConnectionsLoaded.value = true
            newConnectionId.value = connection.id
            connectionMatchedByName.value = props.originalConnectionName != undefined &&
                props.originalConnectionName.trim().length > 0 &&
                props.originalConnectionName.trim().toLowerCase() === connection.name.trim().toLowerCase()
        }
    }
)

function reject(): void {
    emit('reject')
    availableConnections.value = []
    availableConnectionsLoaded.value = false
    newConnectionId.value = undefined
}

async function accept(): Promise<boolean> {
    if (props.troubleshooterCallback == undefined) {
        throw new Error('Cannot accept shared tab without troubleshooter callback.')
    }
    try {
        const sharedTabRequest: TabDefinition<any, any> = await props.troubleshooterCallback(newConnectionId.value!)
        emit('resolve', sharedTabRequest)
        return true
    } catch (e: any) {
        await toaster.error('Could not resolve shared tab', e)
        return false
    }
}
</script>

<template>
    <VFormDialog
        :model-value="modelValue"
        :changed="changed"
        confirm-button-icon="mdi-check"
        :confirm="accept"
        :reset="reject"
    >
        <template #activator="{ props }">
            <slot name="activator" v-bind="{ props }"/>
        </template>

        <template #title>
            {{ t('tabShare.sharedTroubleshooterDialog.title') }}
        </template>

        <template #prepend-form>
            <VAlert type="warning" icon="mdi-alert-outline">
                {{ t('tabShare.sharedTroubleshooterDialog.info') }}
            </VAlert>
        </template>

        <template #default>
            <VAutocomplete
                v-model="newConnectionId"
                :label="t('tabShare.sharedTroubleshooterDialog.form.newConnectionId.label')"
                :hint="connectionMatchedByName ? t('tabShare.sharedTroubleshooterDialog.form.newConnectionId.hint.connectionMatchedByName') : t('tabShare.sharedTroubleshooterDialog.form.newConnectionId.hint.connectionNotMatchedByName')"
                :items="availableConnections"
                item-title="name"
                item-value="id"
                required
                disabled
            />
        </template>

        <template #confirm-button-body>
            {{ t('common.button.accept') }}
        </template>
    </VFormDialog>
</template>

<style lang="scss" scoped>

</style>
