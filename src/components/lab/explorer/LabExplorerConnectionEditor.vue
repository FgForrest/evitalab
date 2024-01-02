<script setup lang="ts">
import { EvitaDBConnection } from '@/model/lab'
import { computed, ref } from 'vue'
import { LabService, useLabService } from '@/services/lab.service'
import { Toaster, useToaster } from '@/services/editor/toaster'
import ky from 'ky'

enum Mode {
    Create,
    Modify
}

enum ApiTestResult {
    NotTested,
    Success,
    Failure
}

const labService: LabService = useLabService()
const toaster: Toaster = useToaster()

const props = withDefaults(defineProps<{
    modelValue: boolean,
    connection?: EvitaDBConnection
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
        return 'Name of connection is required.'
    },
    (value: any) => {
        const exists = labService.isConnectionExists(value)
        if (!exists) return true
        return 'Connection with this name already exists.'
    }
]
const labApiUrlRules = [
    (value: any) => {
        if (value) return true
        return 'evitaLab API URL is required.'
    },
    (value: any) => {
        try {
            new URL(value)
            return true
        } catch (e) {
            return 'evitaLab API URL is not a valid URL.'
        }
    },
    async (value: any) => {
        const result = await testLabApiConnection()
        if (result) {
            modifiedConnection.value.labApiUrlTested = ApiTestResult.Success
            return true
        }
        modifiedConnection.value.labApiUrlTested = ApiTestResult.Failure
        return 'evitaLab API URL is not reachable.'
    }
]
const gqlUrlRules = [
    (value: any) => {
        if (value) return true
        return 'GraphQL API URL is required.'
    },
    (value: any) => {
        try {
            new URL(value)
            return true
        } catch (e) {
            return 'GraphQL API URL is not a valid URL.'
        }
    },
    async (value: any) => {
        const result = await testGqlApiConnection()
        if (result) {
            modifiedConnection.value.gqlUrlTested = ApiTestResult.Success
            return true
        }
        modifiedConnection.value.gqlUrlTested = ApiTestResult.Failure
        return 'GraphQL API URL is not reachable.'
    }
]

const form = ref<HTMLFormElement | null>(null)
const mode = computed<Mode>(() => props.connection ? Mode.Modify : Mode.Create)
const modifiedConnection = ref<{
    name: string,
    labApiUrl: string
    labApiUrlTested: ApiTestResult
    gqlUrl: string,
    gqlUrlTested: ApiTestResult
}>({
    name: '',
    labApiUrl: '',
    labApiUrlTested: ApiTestResult.NotTested,
    gqlUrl: '',
    gqlUrlTested: ApiTestResult.NotTested
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

async function testLabApiConnection(): Promise<boolean> {
    try {
        const response: any = await ky.get(modifiedConnection.value.labApiUrl + '/system/liveness').json()
        return response.liveness || false
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

async function testConnection(): Promise<boolean> {
    let success: boolean = true

    // test lab API
    const labApiResult = await testLabApiConnection()
    if (labApiResult) {
        modifiedConnection.value.labApiUrlTested = ApiTestResult.Success
    } else {
        success = false
        modifiedConnection.value.labApiUrlTested = ApiTestResult.Failure
    }

    // test GQL API
    const gqlApiResult = await testGqlApiConnection()
    if (gqlApiResult) {
        modifiedConnection.value.gqlUrlTested = ApiTestResult.Success
    } else {
        success = false
        modifiedConnection.value.gqlUrlTested = ApiTestResult.Failure
    }

    if (success) {
        toaster.success('Successfully connected.')
    } else {
        toaster.error('Connection test failed.')
    }
    return success
}

function cancel(): void {
    //@ts-ignore
    form.value.reset()
    modifiedConnection.value = {
        name: '',
        labApiUrl: '',
        labApiUrlTested: ApiTestResult.NotTested,
        gqlUrl: '',
        gqlUrlTested: ApiTestResult.NotTested
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
        labService.addConnection(new EvitaDBConnection(
            undefined,
            modifiedConnection.value.name!,
            false,
            modifiedConnection.value.labApiUrl!,
            'https://localhost:5555/rest', // todo lho implement rest
            modifiedConnection.value.gqlUrl!
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
            <VCardTitle v-if="mode === Mode.Create">Add connection</VCardTitle>
            <VCardTitle v-if="mode === Mode.Modify">Edit connection</VCardTitle>

            <VCardText>
                <VForm
                    ref="form"
                    validate-on="submit"
                >
                    <VTextField
                        v-model="modifiedConnection.name"
                        label="Connection name"
                        placeholder="evitaDB"
                        variant="solo-filled"
                        :rules="nameRules"
                        required
                    />
                    <VTextField
                        v-model="modifiedConnection.labApiUrl"
                        label="evitaLab API URL"
                        placeholder="https://{evitadb-server}:5555/lab/api"
                        variant="solo-filled"
                        required
                        :rules="labApiUrlRules"
                        :append-inner-icon="getApiTestedIndicator(modifiedConnection.labApiUrlTested)"
                    />
                    <VTextField
                        v-model="modifiedConnection.gqlUrl"
                        label="GraphQL API URL"
                        placeholder="https://{evitadb-server}:5555/gql"
                        variant="solo-filled"
                        required
                        :rules="gqlUrlRules"
                        :append-inner-icon="getApiTestedIndicator(modifiedConnection.gqlUrlTested)"
                    />
                </VForm>
            </VCardText>

            <VCardActions class="px-6">
                <VBtn
                    variant="plain"
                    prepend-icon="mdi-connection"
                    @click="testConnection"
                >
                    Test connection
                </VBtn>
                <VSpacer/>
                <VBtn
                    variant="tonal"
                    @click="cancel">
                    Cancel
                </VBtn>
                <VBtn
                    variant="outlined"
                    prepend-icon="mdi-content-save"
                    @click="storeConnection"
                    class="ml-4"
                >
                    Save
                </VBtn>
            </VCardActions>
        </VCard>
    </VDialog>
</template>

<style lang="scss" scoped>

</style>
