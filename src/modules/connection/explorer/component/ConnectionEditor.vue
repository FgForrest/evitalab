<script setup lang="ts">
import { computed, ref } from 'vue'
import ky from 'ky'
import { useI18n } from 'vue-i18n'
import { ConnectionService, useConnectionService } from '@/modules/connection/service/ConnectionService'
import { Toaster, useToaster } from '@/modules/notification/service/Toaster'
import { Connection } from '@/modules/connection/model/Connection'

enum Mode {
    Add,
    Modify
}

enum ApiTestResult {
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

// todo lho this is horrible
const nameRules = [
    (value: any) => {
        if (value) return true
        return t('explorer.connection.editor.form.connectionName.validations.required')
    },
    (value: any) => {
        const exists = connectionService.isConnectionExists(value)
        if (!exists) return true
        return t('explorer.connection.editor.form.connectionName.validations.duplicate')
    }
]
const systemApiUrlRules = [
    (value: any) => {
        if (value) return true
        return t('explorer.connection.editor.form.systemApiUrl.validations.required')
    },
    (value: any) => {
        try {
            new URL(value)
            return true
        } catch (e) {
            return t('explorer.connection.editor.form.systemApiUrl.validations.invalidUrl')
        }
    },
    async (value: any) => {
        const result = await testSystemApiConnection()
        if (result) {
            modifiedConnection.value.systemApiUrlTested = ApiTestResult.Success
            return true
        }
        modifiedConnection.value.systemApiUrlTested = ApiTestResult.Failure
        return t('explorer.connection.editor.form.systemApiUrl.validations.unreachable')
    }
]
const grpcUrlRules = [
    (value: any) => {
        if (value) return true
        return t('explorer.connection.editor.form.grpcUrl.validations.required')
    },
    (value: any) => {
        try {
            new URL(value)
            return true
        } catch (e) {
            return t('explorer.connection.editor.form.grpcUrl.validations.invalidUrl')
        }
    },
    async (value: any) => {
        const result = await testLabApiConnection()
        if (result) {
            modifiedConnection.value.grpcUrlTested = ApiTestResult.Success
            return true
        }
        modifiedConnection.value.grpcUrlTested = ApiTestResult.Failure
        return t('explorer.connection.editor.form.grpcUrl.validations.unreachable')
    }
]
const gqlUrlRules = [
    (value: any) => {
        if (value) return true
        return t('explorer.connection.editor.form.graphQLApiUrl.validations.required')
    },
    (value: any) => {
        try {
            new URL(value)
            return true
        } catch (e) {
            return t('explorer.connection.editor.form.graphQLApiUrl.validations.invalidUrl')
        }
    },
    async (value: any) => {
        const result = await testGqlApiConnection()
        if (result) {
            modifiedConnection.value.gqlUrlTested = ApiTestResult.Success
            return true
        }
        modifiedConnection.value.gqlUrlTested = ApiTestResult.Failure
        return t('explorer.connection.editor.form.graphQLApiUrl.validations.unreachable')
    }
]
const restUrlRules = [
    (value: any) => {
        if (value) return true
        return t('explorer.connection.editor.form.restApiUrl.validations.required')
    },
    (value: any) => {
        try {
            new URL(value)
            return true
        } catch (e) {
            return t('explorer.connection.editor.form.restApiUrl.validations.invalidUrl')
        }
    },
    async (value: any) => {
        const result = await testGqlApiConnection()
        if (result) {
            modifiedConnection.value.restUrlTested = ApiTestResult.Success
            return true
        }
        modifiedConnection.value.restUrlTested = ApiTestResult.Failure
        return t('explorer.connection.editor.form.restApiUrl.validations.unreachable')
    }
]

const form = ref<HTMLFormElement | null>(null)
const mode = computed<Mode>(() => props.connection ? Mode.Modify : Mode.Add)
const modifiedConnection = ref<{
    name: string,
    systemApiUrl: string,
    systemApiUrlTested: ApiTestResult,
    grpcUrl: string
    grpcUrlTested: ApiTestResult
    gqlUrl: string,
    gqlUrlTested: ApiTestResult,
    restUrl: string,
    restUrlTested: ApiTestResult
}>({
    name: '',
    systemApiUrl: '',
    systemApiUrlTested: ApiTestResult.NotTested,
    grpcUrl: '',
    grpcUrlTested: ApiTestResult.NotTested,
    gqlUrl: '',
    gqlUrlTested: ApiTestResult.NotTested,
    restUrl: '',
    restUrlTested: ApiTestResult.NotTested
})

function getApiTestedIndicator(result: ApiTestResult): any  {
    switch (result) {
        case ApiTestResult.NotTested:
            return null
        case ApiTestResult.Success:
            return 'mdi-check-circle-outline'
        case ApiTestResult.Failure:
            return 'mdi-close-circle-outline'
    }
}

async function testSystemApiConnection(): Promise<boolean> {
    try {
        const response: string | undefined = await ky.get(modifiedConnection.value.systemApiUrl + '/server-name').text()
        return response != undefined && response.length > 0
    } catch (e) {
        return false
    }
}

async function testLabApiConnection(): Promise<boolean> {
    try {
        const emptyObj = {};
        const response: Response = await ky.post(modifiedConnection.value.grpcUrl + '/io.evitadb.externalApi.grpc.generated.EvitaManagementService/ServerStatus', {json: emptyObj, headers: {
            'content-type': 'application/json; charset=utf-8'
        } });
        return response.ok || false
    } catch (e) {
        return false
    }
}

async function testGqlApiConnection(): Promise<boolean> {
    try {
        const response: any = await ky.post(
            modifiedConnection.value.gqlUrl + '/system',
            {
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    query: `
                    {
                        liveness
                    }
                `
                })
            }
        ).json()
        return response?.data?.liveness || false
    } catch (e) {
        return false
    }
}

async function testRestApiConnection(): Promise<boolean> {
    // todo lho cors doesnt work
    return true
    // try {
    //     const response: any = await ky.get(
    //         modifiedConnection.value.restUrl + '/system/liveness',
    //         {
    //             headers: {
    //                 'Content-Type': 'application/json'
    //             }
    //         }
    //     ).json()
    //     return response?.liveness || false
    // } catch (e) {
    //     return false
    // }
}

async function testConnection(): Promise<boolean> {
    let success: boolean = true

    // test system API
    const systemApiResult = await testSystemApiConnection()
    if (systemApiResult) {
        modifiedConnection.value.systemApiUrlTested = ApiTestResult.Success
    } else {
        modifiedConnection.value.systemApiUrlTested = ApiTestResult.Failure
    }

    // test grpc API
    const labApiResult = await testLabApiConnection()
    if (labApiResult) {
        modifiedConnection.value.grpcUrlTested = ApiTestResult.Success
    } else {
        success = false
        modifiedConnection.value.grpcUrlTested = ApiTestResult.Failure
    }

    // test GQL API
    const gqlApiResult = await testGqlApiConnection()
    if (gqlApiResult) {
        modifiedConnection.value.gqlUrlTested = ApiTestResult.Success
    } else {
        success = false
        modifiedConnection.value.gqlUrlTested = ApiTestResult.Failure
    }

    const restApiResult = await testRestApiConnection()
    if (restApiResult) {
        modifiedConnection.value.restUrlTested = ApiTestResult.Success
    } else {
        success = false
        modifiedConnection.value.restUrlTested = ApiTestResult.Failure
    }

    if (success) {
        toaster.success(t('explorer.connection.editor.notification.connectionSuccess'))
    } else {
        toaster.error(t('explorer.connection.editor.notification.connectionError'))
    }
    return success
}

function cancel(): void {
    //@ts-ignore
    form.value.reset()
    modifiedConnection.value = {
        name: '',
        systemApiUrl: '',
        systemApiUrlTested: ApiTestResult.NotTested,
        grpcUrl: '',
        grpcUrlTested: ApiTestResult.NotTested,
        gqlUrl: '',
        gqlUrlTested: ApiTestResult.NotTested,
        restUrl: '',
        restUrlTested: ApiTestResult.NotTested
    }
    emit('update:modelValue', false)
}

async function storeConnection(): Promise<void> {
    //@ts-ignore
    const { valid }: any = await form.value.validate()
    if (!valid) {
        return
    }

    try {
        connectionService.addConnection(new Connection(
            undefined,
            modifiedConnection.value.name!,
            false,
            modifiedConnection.value.systemApiUrl,
            modifiedConnection.value.grpcUrl!,
            modifiedConnection.value.gqlUrl!,
            modifiedConnection.value.restUrl!
        ))
    } catch (e: any) {
        toaster.error(e)
        return
    }

    //@ts-ignore
    form.value.reset()
    emit('update:modelValue', false)
}
</script>

<template>
    <VDialog
        :model-value="modelValue"
        @update:model-value="$emit('update:modelValue', $event)"
        persistent
        max-width="36rem"
    >
        <template #activator="{ props }">
            <slot name="activator" v-bind="props"/>
        </template>

        <VCard class="py-8 px-4">
            <VCardTitle v-if="mode === Mode.Add">{{ t('explorer.connection.editor.addTitle') }}</VCardTitle>
            <VCardTitle v-if="mode === Mode.Modify">{{ t('explorer.connection.editor.editTitle') }}</VCardTitle>

            <VCardText>
                <VForm
                    ref="form"
                    validate-on="submit"
                >
                    <VTextField
                        v-model="modifiedConnection.name"
                        :label="t('explorer.connection.editor.form.connectionName.label')"
                        placeholder="evitaDB"
                        variant="solo-filled"
                        :rules="nameRules"
                        required
                    />
                    <VTextField
                        v-model="modifiedConnection.systemApiUrl"
                        :label="t('explorer.connection.editor.form.systemApiUrl.label')"
                        placeholder="https://{evitadb-server}:5555/system"
                        variant="solo-filled"
                        required
                        :rules="systemApiUrlRules"
                        :append-inner-icon="getApiTestedIndicator(modifiedConnection.systemApiUrlTested)"
                    />
                    <VTextField
                        v-model="modifiedConnection.grpcUrl"
                        :label="t('explorer.connection.editor.form.grpcUrl.label')"
                        placeholder="https://{evitadb-server}:5555/lab/api"
                        variant="solo-filled"
                        required
                        :rules="grpcUrlRules"
                        :append-inner-icon="getApiTestedIndicator(modifiedConnection.grpcUrlTested)"
                    />
                    <VTextField
                        v-model="modifiedConnection.gqlUrl"
                        :label="t('explorer.connection.editor.form.graphQLApiUrl.label')"
                        placeholder="https://{evitadb-server}:5555/gql"
                        variant="solo-filled"
                        required
                        :rules="gqlUrlRules"
                        :append-inner-icon="getApiTestedIndicator(modifiedConnection.gqlUrlTested)"
                    />
                    <VTextField
                        v-model="modifiedConnection.restUrl"
                        :label="t('explorer.connection.editor.form.restApiUrl.label')"
                        placeholder="https://{evitadb-server}:5555/rest"
                        variant="solo-filled"
                        required
                        :rules="restUrlRules"
                        :append-inner-icon="getApiTestedIndicator(modifiedConnection.restUrlTested)"
                    />
                </VForm>
            </VCardText>

            <VCardActions class="px-6">
                <VBtn
                    variant="plain"
                    prepend-icon="mdi-connection"
                    @click="testConnection"
                >
                    {{ t('explorer.connection.editor.button.testConnection') }}
                </VBtn>
                <VSpacer/>
                <VBtn
                    variant="tonal"
                    @click="cancel">
                    {{ t('common.button.cancel') }}
                </VBtn>
                <VBtn
                    variant="outlined"
                    prepend-icon="mdi-content-save"
                    @click="storeConnection"
                    class="ml-4"
                >
                    {{ t('common.button.save') }}
                </VBtn>
            </VCardActions>
        </VCard>
    </VDialog>
</template>

<style lang="scss" scoped>

</style>
