<script setup lang="ts">

import RestoreLocalBackupFileDialog from '@/modules/backup-viewer/components/RestoreLocalBackupFileDialog.vue'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const showRestoreDialog = ref<boolean>(false)
</script>

<template>
    <RestoreLocalBackupFileDialog v-model="showRestoreDialog">
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
