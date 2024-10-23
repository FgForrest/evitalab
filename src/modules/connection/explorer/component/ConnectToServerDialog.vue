<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import ky from 'ky'
import { useI18n } from 'vue-i18n'
import { ConnectionService, useConnectionService } from '@/modules/connection/service/ConnectionService'
import { Toaster, useToaster } from '@/modules/notification/service/Toaster'
import { Connection } from '@/modules/connection/model/Connection'
import VFormDialog from '@/modules/base/component/VFormDialog.vue'

enum ConnectionTestResult {
    NotTested,
    Success,
    Failure
}

const connectionService: ConnectionService = useConnectionService()
const toaster: Toaster = useToaster()
const { t } = useI18n()

const props = withDefaults(defineProps<{
    modelValue: boolean,
    connection?: Connection
}>(), {
    connection: undefined
})

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
}>()

const connectionNameRules = [
    (value: any) => {
        if (value) return true
        return t('explorer.connection.connect.form.connectionName.validations.required')
    },
    (value: any) => {
        const exists = connectionService.isConnectionExists(value)
        if (!exists) return true
        return t('explorer.connection.connect.form.connectionName.validations.duplicate')
    }
]
const serverUrlRules = [
    (value: any) => {
        if (value) return true
        return t('explorer.connection.connect.form.serverUrl.validations.required')
    },
    (value: any) => {
        try {
            new URL(value)
            return true
        } catch (e) {
            return t('explorer.connection.connect.form.serverUrl.validations.invalidUrl')
        }
    },
    async (value: any) => {
        const resultError: string | undefined = await testConnection(value)
        if (resultError == undefined) {
            connectionTestResult.value = ConnectionTestResult.Success
            return true
        }
        connectionTestResult.value = ConnectionTestResult.Failure
        return resultError
    }
]

const connectionName = ref<string>('')
const serverUrl = ref<string>('')
const connectionTestResult = ref<ConnectionTestResult>(ConnectionTestResult.NotTested)
const changed = computed<boolean>(() =>
    (connectionName.value != undefined && connectionName.value.length > 0) &&
    (serverUrl.value != undefined && serverUrl.value.length > 0))

const connectionTestResultIndicator = computed<string>(() => {
    switch (connectionTestResult.value) {
        case ConnectionTestResult.NotTested:
            return ''
        case ConnectionTestResult.Success:
            return 'mdi-check-circle-outline'
        case ConnectionTestResult.Failure:
            return 'mdi-close-circle-outline'
    }
})

async function testConnection(serverUrl: string): Promise<string | undefined> {
    try {
        // todo lho this should be returned by driver with conversion depended
        //  on server version, but we don't want to cache every connection
        const normalizedUrl: string = serverUrl.endsWith('/') ? serverUrl : serverUrl + '/'
        const serverStatus: any = await ky.post(
            `${normalizedUrl}io.evitadb.externalApi.grpc.generated.EvitaManagementService/ServerStatus`,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: '{}'
            }
        )
            .json()

        if (serverStatus.readiness !== 'API_READY') {
            return t('explorer.connection.connect.form.serverUrl.validations.notReady')
        }
        if (serverStatus.api.lab?.enabled !== true) {
            return t('explorer.connection.connect.form.serverUrl.validations.labApiMissing')
        }
        // if (!(serverStatus.api.lab?.baseUrl as string[] || []).includes(`${serverUrl}lab/`)) {
        //     return t('explorer.connection.connect.form.serverUrl.validations.notLabUrl')
        // }
        // todo lho test all enabled apis?
        if (serverStatus.api.gRPC?.enabled !== true) {
            return t('explorer.connection.connect.form.serverUrl.validations.grpcApiMissing')
        }
        return undefined
    } catch (e) {
        // todo lho catch selfsigned certificate and redirect to the url
        return t('explorer.connection.connect.form.serverUrl.validations.unreachable')
    }
}

function reset(): void {
    connectionName.value = ''
    serverUrl.value = ''
    connectionTestResult.value = ConnectionTestResult.NotTested
}

async function storeConnection(): Promise<boolean> {
    try {
        connectionService.addConnection(Connection.user(
            undefined,
            connectionName.value,
            serverUrl.value
        ))

        toaster.success(t(
            'explorer.connection.connect.notification.connectionAdded',
            { connectionName: connectionName.value }
        ))
        return true
    } catch (e: any) {
        toaster.error(t(
            'explorer.connection.connect.notification.couldNotAddConnection',
            { reason: e.message }
        ))
        return false
    }
}
</script>

<template>
    <VFormDialog
        :model-value="modelValue"
        :changed="changed"
        confirm-button-icon="mdi-power-plug-outline"
        :confirm="storeConnection"
        :reset="reset"
        @update:model-value="emit('update:modelValue', $event)"
    >
        <template #activator="{ props }">
            <slot name="activator" v-bind="{ props }"/>
        </template>

        <template #title>
            {{ t('explorer.connection.connect.title') }}
        </template>

        <template #default>
            <VTextField
                v-model="connectionName"
                :label="t('explorer.connection.connect.form.connectionName.label')"
                placeholder="evitaDB"
                :rules="connectionNameRules"
                required
            />
            <VTextField
                v-model="serverUrl"
                :label="t('explorer.connection.connect.form.serverUrl.label')"
                placeholder="https://{evitadb-server}:5555"
                :hint="t('explorer.connection.connect.form.serverUrl.hint')"
                required
                :rules="serverUrlRules"
                :append-inner-icon="connectionTestResultIndicator"
            />
        </template>

        <template #confirm-button-body>
            {{ t('explorer.connection.connect.button.connect') }}
        </template>
    </VFormDialog>
</template>

<style lang="scss" scoped>

</style>
