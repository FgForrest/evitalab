<script setup lang="ts">

import { Extension } from '@codemirror/state'
import { yaml } from '@codemirror/lang-yaml'
import { useI18n } from 'vue-i18n'
import VPreviewEditorDialog from '@/modules/code-editor/component/VPreviewEditorDialog.vue'
import { ref } from 'vue'
import VLabDialog from '@/modules/base/component/VLabDialog.vue'
import { ServerViewerService, useServerViewerService } from '@/modules/server-viewer/service/ServerViewerService'
import { Connection } from '@/modules/connection/model/Connection'
import { Toaster, useToaster } from '@/modules/notification/service/Toaster'
import { ServerStatus } from '@/modules/connection/model/status/ServerStatus'

const serverViewerService: ServerViewerService = useServerViewerService()
const toaster: Toaster = useToaster()
const { t } = useI18n()

const props = defineProps<{
    modelValue: boolean,
    connection: Connection,
    serverStatus: ServerStatus
}>()
const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
}>()

const runtimeConfigurationLoaded = ref<boolean>(false)
const runtimeConfiguration = ref<string>()
const additionalExtensions: Extension[] = [yaml()]

async function loadRuntimeConfiguration(reload: boolean = false): Promise<boolean> {
    if (!runtimeConfigurationLoaded.value && reload) {
        return true
    }
    if (props.serverStatus.readOnly) {
        runtimeConfiguration.value = ''
        runtimeConfigurationLoaded.value = true
        return true
    }

    try {
        runtimeConfiguration.value = await serverViewerService.getRuntimeConfiguration(props.connection)
        if (!runtimeConfigurationLoaded.value) {
            runtimeConfigurationLoaded.value = true
        }
        return true
    } catch (e: any) {
        toaster.error(t(
            'serverViewer.serverStatus.runtimeConfiguration.notification.couldNotLoadConfiguration',
            { reason: e.message }
        ))
        return false
    }
}

loadRuntimeConfiguration().then()

defineExpose<{
    reload(): Promise<boolean>
}>({
    reload: () => loadRuntimeConfiguration(true)
})
</script>

<template>
    <VPreviewEditorDialog
        v-if="runtimeConfigurationLoaded"
        :model-value="modelValue"
        :content="runtimeConfiguration!"
        :additional-extensions="additionalExtensions"
        @update:model-value="emit('update:modelValue', $event)"
    >
        <template #activator="{ props }">
            <slot name="activator" v-bind="{ props }" />
        </template>

        <template #title>
            {{ t('serverViewer.serverStatus.runtimeConfiguration.title') }}
        </template>
    </VPreviewEditorDialog>

    <VLabDialog
        v-else
        :model-value="modelValue"
        @update:model-value="emit('update:modelValue', $event)"
    >
        <template #title>
            {{ t('serverViewer.serverStatus.runtimeConfiguration.title') }}
        </template>

        <template #default>
            <VProgressLinear indeterminate />
        </template>
    </VLabDialog>
</template>

<style lang="scss" scoped>
</style>
