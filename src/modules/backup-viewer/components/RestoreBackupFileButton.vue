<script setup lang="ts">

import { ServerFile } from '@/modules/database-driver/request-response/server-file/ServerFile'
import RestoreBackupFileDialog from '@/modules/backup-viewer/components/RestoreBackupFileDialog.vue'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

defineProps<{
    backupFile: ServerFile
}>()
const emit = defineEmits<{
    (e: 'restore'): void
}>()

const showRestoreDialog = ref<boolean>(false)
</script>

<template>
    <RestoreBackupFileDialog
        v-model="showRestoreDialog"
        :backup-file="backupFile"
        @restore="emit('restore')"
    >
        <template #activator="{ props }">
            <VBtn
                icon
                @click="showRestoreDialog = true"
                v-bind="props"
            >
                <VIcon>mdi-cloud-upload-outline</VIcon>

                <VTooltip activator="parent">
                    {{ t('backupViewer.list.backup.button.restoreBackupFile') }}
                </VTooltip>
            </VBtn>
        </template>
    </RestoreBackupFileDialog>
</template>

<style lang="scss" scoped>

</style>
