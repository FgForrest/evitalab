<script setup lang="ts">
import VTabMainActionButton from '@/modules/base/component/VTabMainActionButton.vue'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import BackupSelector from '@/modules/backup-viewer/components/BackupSelector.vue'

const { t } = useI18n()

const emit = defineEmits<{
    (e: 'backup'): void
}>()

const showBackupCatalogDialog = ref<boolean>(false)
</script>

<template>
    <BackupSelector
        v-model="showBackupCatalogDialog"
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
    </BackupSelector>
</template>

<style lang="scss" scoped>

</style>
