<script setup lang="ts">

import VFormDialog from '@/modules/base/component/VFormDialog.vue'
import { useI18n } from 'vue-i18n'
import { ConnectionId } from '@/modules/connection/model/ConnectionId'
import { computed, ref, watch } from 'vue'
import { ConnectionService, useConnectionService } from '@/modules/connection/service/ConnectionService'
import { Connection } from '@/modules/connection/model/Connection'
import { SharedTabTroubleshooterCallback } from '@/modules/workspace/tab/service/SharedTabTroubleshooterCallback'
import { TabDefinition } from '@/modules/workspace/tab/model/TabDefinition'
import { Toaster, useToaster } from '@/modules/notification/service/Toaster'

const connectionService: ConnectionService = useConnectionService()
const toaster: Toaster = useToaster()
const { t } = useI18n()

const props = withDefaults(defineProps<{
    modelValue: boolean,
    originalConnectionName?: string,
    troubleshooterCallback: SharedTabTroubleshooterCallback
}>(), {
    originalConnectionName: undefined
})
const emit = defineEmits<{
    (e: 'resolve', value: TabDefinition<any, any>): void,
    (e: 'reject'): void
}>()

const availableConnections = ref<Connection[]>([])
const availableConnectionsLoaded = ref<boolean>(false)
const newConnectionId = ref<ConnectionId | undefined>(undefined)

const newConnectionIdRules = [
    (value: string): any => {
        if (value != undefined && value.trim().length > 0) return true
        return t('tabShare.sharedTroubleshooterDialog.form.newConnectionId.validations.required')
    },
    async (value: string): Promise<any> => {
        try {
            connectionService.getConnection(value)
            return true
        } catch (e) {
            return t('tabShare.sharedTroubleshooterDialog.form.newConnectionId.validations.notExists')
        }
    }
]

const changed = computed<boolean>(() =>
    newConnectionId.value != undefined && newConnectionId.value.trim().length > 0)

watch(
    () => props.modelValue,
    (newValue) => {
        if (newValue) {
            availableConnections.value = connectionService.getConnections().toArray()
            availableConnectionsLoaded.value = true
            if (props.originalConnectionName != undefined && props.originalConnectionName.trim().length > 0) {
                const similarConnection: Connection | undefined = availableConnections.value
                    .find(it =>
                        it.name.trim().toLowerCase() === props.originalConnectionName!.trim().toLocaleLowerCase()) as Connection | undefined
                if (similarConnection != undefined) {
                    newConnectionId.value = similarConnection.id
                }
            }
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
                :hint="t('tabShare.sharedTroubleshooterDialog.form.newConnectionId.hint')"
                :items="availableConnections"
                item-title="name"
                item-value="id"
                :rules="newConnectionIdRules"
                required
                :disabled="!availableConnectionsLoaded"
            />
        </template>

        <template #confirm-button-body>
            {{ t('common.button.accept') }}
        </template>
    </VFormDialog>
</template>

<style lang="scss" scoped>

</style>
