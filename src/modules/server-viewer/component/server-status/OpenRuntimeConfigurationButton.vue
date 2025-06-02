<script setup lang="ts">

import { useI18n } from 'vue-i18n'
import { ref } from 'vue'
import RuntimeConfigurationDialog from '@/modules/server-viewer/component/server-status/RuntimeConfigurationDialog.vue'
import { ServerStatus } from '@/modules/database-driver/request-response/status/ServerStatus'

const { t } = useI18n()

const props = defineProps<{
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
