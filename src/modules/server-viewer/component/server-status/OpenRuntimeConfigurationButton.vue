<script setup lang="ts">

import { useI18n } from 'vue-i18n'
import { ref } from 'vue'
import { ServerStatus } from '@/modules/connection/model/status/ServerStatus'
import { Connection } from '@/modules/connection/model/Connection'
import RuntimeConfigurationDialog from '@/modules/server-viewer/component/server-status/RuntimeConfigurationDialog.vue'

const { t } = useI18n()

const props = defineProps<{
    connection: Connection
    serverStatus: ServerStatus
}>()

const dialogRef = ref<typeof RuntimeConfigurationDialog>()

const showRuntimeConfigurationDialog = ref<boolean>(false)

defineExpose<{
    reload(): Promise<boolean>
}>({
    reload: () => dialogRef.value?.reload()
})
</script>

<template>
    <RuntimeConfigurationDialog
        ref="dialogRef"
        v-model="showRuntimeConfigurationDialog"
        :connection="connection"
        :server-status="serverStatus"
    >
        <template #activator="{ props }">
            <VBtn :disabled="serverStatus.readOnly" v-bind="props">
                {{ t('serverViewer.serverStatus.button.openRuntimeConfiguration') }}
            </VBtn>
        </template>
    </RuntimeConfigurationDialog>
</template>

<style lang="scss" scoped>

</style>
