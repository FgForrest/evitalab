<script setup lang="ts">

import RestoreLocalBackupFileDialog from '@/modules/backup-viewer/components/RestoreLocalBackupFileDialog.vue'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Connection } from '@/modules/connection/model/Connection'

const { t } = useI18n()

const props = defineProps<{
    connection: Connection
}>()

const showRestoreDialog = ref<boolean>(false)
</script>

<template>
    <RestoreLocalBackupFileDialog
        v-model="showRestoreDialog"
        :connection="connection"
    >
        <template #activator="{ props }">
            <VBtn
                icon
                @click="showRestoreDialog = true"
                v-bind="props"
            >
                <VIcon>mdi-cloud-upload-outline</VIcon>

                <VTooltip activator="parent">
                    {{ t('backupViewer.button.restoreLocalBackup') }}
                </VTooltip>
            </VBtn>
        </template>
    </RestoreLocalBackupFileDialog>
</template>

<style lang="scss" scoped>

</style>
