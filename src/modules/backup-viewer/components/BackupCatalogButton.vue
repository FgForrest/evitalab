<script setup lang="ts">

import BackupCatalogDialog from '@/modules/backup-viewer/components/BackupCatalogDialog.vue'
import VTabMainActionButton from '@/modules/base/component/VTabMainActionButton.vue'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps<{
}>()
const emit = defineEmits<{
    (e: 'backup'): void
}>()

const showBackupCatalogDialog = ref<boolean>(false)
</script>

<template>
    <BackupCatalogDialog
        v-model="showBackupCatalogDialog"
        @backup="emit('backup')"
    >
        <template #activator="{ props }">
            <VTabMainActionButton
                prepend-icon="mdi-cloud-download-outline"
                @click="showBackupCatalogDialog = true"
                v-bind="props"
            >
                {{ t('backupViewer.button.backupCatalog') }}
            </VTabMainActionButton>
        </template>
    </BackupCatalogDialog>
</template>

<style lang="scss" scoped>

</style>
