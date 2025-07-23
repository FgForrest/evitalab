<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { BackupViewerService, useBackupViewerService } from '@/modules/backup-viewer/service/BackupViewerService.ts'
import { CatalogStatistics } from '@/modules/database-driver/request-response/CatalogStatistics.ts'
import { List as ImmutableList } from 'immutable'
import type { Toaster } from '@/modules/notification/service/Toaster'
import { useToaster } from '@/modules/notification/service/Toaster'
import { BackupType } from '@/modules/backup-viewer/model/BackupType.ts'
import SnapshotBackupDialog from '@/modules/backup-viewer/components/SnapshotBackupDialog.vue'
import PointInTimeBackupDialog from '@/modules/backup-viewer/components/PointInTimeBackupDialog.vue'
import FullBackupDialog from '@/modules/backup-viewer/components/FullBackupDialog.vue'
import VLabDialog from '@/modules/base/component/VLabDialog.vue'
import { watch } from 'vue'

const toaster: Toaster = useToaster()
const { t } = useI18n()
const backupViewerService: BackupViewerService = useBackupViewerService()

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void,
    (e: 'backup'): void
}>()

const props = defineProps<{
    modelValue: boolean,
    catalogName?: string
}>()

watch(
    () => props.modelValue,
    (newValue) => {
        if (newValue && availableCatalogsLoaded.value == false) {
            loadAvailableCatalogs().then()
        }
    }
)
const catalogName = ref<string | undefined>(props.catalogName)

onUnmounted(() => {
    backupViewerService.unregisterAvailableCatalogsChangeCallback(availableCatalogsChangeCallbackId)
})

const availableCatalogs = ref<string[]>([])
const availableCatalogsChangeCallbackId = backupViewerService.registerAvailableCatalogsChangeCallback(async () =>
    await loadAvailableCatalogs())
const availableCatalogsLoaded = ref<boolean>(false)

async function loadAvailableCatalogs(): Promise<void> {
    try {
        const fetchedAvailableCatalogs: ImmutableList<CatalogStatistics> = await backupViewerService.getAvailableCatalogs()
        availableCatalogs.value = fetchedAvailableCatalogs
            .filter(it => !it.corrupted)
            .map(it => it.name)
            .toArray()

        availableCatalogsLoaded.value = true
    } catch (e: any) {
        await toaster.error(t(
            'backupViewer.backup.notification.couldNotLoadAvailableCatalogs',
            { reason: e.message }
        ))
    }
}

function openBackupDialog(backupType: BackupType): void {
    switch (backupType) {
        case BackupType.Full:
            fullBackupCatalogModelValue.value = !fullBackupCatalogModelValue.value
            break
        case BackupType.CurrentSnapshot:
            backupActualDataModelValue.value = !backupActualDataModelValue.value
            break
        case BackupType.PointInTime:
            backupCatalogModelValue.value = !backupCatalogModelValue.value
            break
    }
}

function backup(){
    emit('backup')
    emit('update:modelValue', false)
}

const backupCatalogModelValue = ref<boolean>(false)
const fullBackupCatalogModelValue = ref<boolean>(false)
const backupActualDataModelValue = ref<boolean>(false)

</script>

<template>
    <template
        v-if="(backupCatalogModelValue || fullBackupCatalogModelValue || backupActualDataModelValue) && catalogName">
        <SnapshotBackupDialog @backup="() => backup()"
                              @update:model-value="value => backupActualDataModelValue = value"
                              :model-value="backupActualDataModelValue"
                              :catalog-name="catalogName!"
                              :availableCatalogs="availableCatalogs" />
        <PointInTimeBackupDialog :catalogName="catalogName!" :model-value="backupCatalogModelValue"
                                 @update:model-value="value => backupCatalogModelValue = value"
                                 :available-catalogs="availableCatalogs"
                                 @backup="() => backup()" />
        <FullBackupDialog :catalog-name="catalogName!"
                          :model-value="fullBackupCatalogModelValue"
                          @update:model-value="value => fullBackupCatalogModelValue = value"
                          :available-catalogs="availableCatalogs"
                          @backup="() => backup()" />
    </template>
    <template v-else>
        <VLabDialog :model-value="modelValue" @update:model-value="value => emit('update:modelValue', value)" max-width="42rem">
            <template #activator="{ props }">
                <slot name="activator" v-bind="{ props }"></slot>
            </template>
            <template #title>
                {{ t('backupViewer.backup.title') }}
            </template>
            <template #default>
                <VAutocomplete v-model="catalogName" :items="availableCatalogs" :disabled="!availableCatalogsLoaded" />
                <div class="buttons-container">
                    <div class="box-item">
                        <VIcon class="icon" :size="100" :disabled="!catalogName"
                               @click="openBackupDialog(BackupType.CurrentSnapshot)">mdi-clock-time-four-outline
                        </VIcon>
                        <VBtn class="btn-select" @click="openBackupDialog(BackupType.CurrentSnapshot)" :disabled="!catalogName">
                            {{ t('backupViewer.backupSelector.currentSnapshot') }}
                        </VBtn>
                    </div>
                    <div class="box-item">
                        <VIcon class="icon" :size="100" :disabled="!catalogName"
                               @click="openBackupDialog(BackupType.PointInTime)">mdi-timeline-clock-outline
                        </VIcon>
                        <VBtn class="btn-select" @click="openBackupDialog(BackupType.PointInTime)" :disabled="!catalogName">
                            {{ t('backupViewer.backupSelector.pointInTime') }}
                        </VBtn>
                    </div>
                    <div class="box-item">
                        <VIcon class="icon" :size="100" :disabled="!catalogName"
                               @click="openBackupDialog(BackupType.Full)">mdi-cloud-upload-outline
                        </VIcon>
                        <VBtn class="btn-select" @click="openBackupDialog(BackupType.Full)" :disabled="!catalogName">
                            {{ t('backupViewer.backupSelector.fullBackup') }}
                        </VBtn>
                    </div>
                </div>
            </template>
        </VLabDialog>
    </template>
</template>

<style scoped lang="scss">
.buttons-container {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
}

.buttons-container button {
    margin-top: 10px;
}

.box-item {
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.box-item:first-child{
    margin-right: 10px;
}

.box-item:last-child{
    margin-left: 10px;
}

.buttons-container div:not(:last-child):not(:first-child) {
    border-left: 1px solid white;
    border-right: 1px solid white;
    padding-left: 15px;
    padding-right: 15px;
}

.box-item p {
    margin-top: 20px;
}

hr {
    margin-top: 20px;
    margin-bottom: 20px;
}

.cancel {
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
}

.icon {
    align-self: center;
}

.btn-select {
    min-width: 187px;
}
</style>
