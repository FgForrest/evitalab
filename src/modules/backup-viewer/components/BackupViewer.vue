<script setup lang="ts">
import { TabComponentEvents } from '@/modules/workspace/tab/model/TabComponentEvents'
import { List } from 'immutable'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { TabComponentProps } from '@/modules/workspace/tab/model/TabComponentProps'
import { VoidTabData } from '@/modules/workspace/tab/model/void/VoidTabData'
import { BackupViewerTabParams } from '@/modules/backup-viewer/model/BackupViewerTabParams'
import { TaskState } from '@/modules/connection/model/task/TaskState'
import VTabToolbar from '@/modules/base/component/VTabToolbar.vue'
import { backupTaskName } from '@/modules/backup-viewer/model/BackupTask'
import { restoreTaskName } from '@/modules/backup-viewer/model/RestoreTask'
import TaskList from '@/modules/task-viewer/components/TaskList.vue'
import BackupList from '@/modules/backup-viewer/components/BackupList.vue'
import BackupCatalogButton from '@/modules/backup-viewer/components/BackupCatalogButton.vue'
import RestoreLocalBackupFileButton from '@/modules/backup-viewer/components/RestoreLocalBackupFileButton.vue'

const shownTaskStates: TaskState[] = [TaskState.WaitingForPrecondition, TaskState.Running, TaskState.Queued, TaskState.Failed]
const shownTaskTypes: string[] = [backupTaskName, restoreTaskName]

const { t } = useI18n()

const props = defineProps<TabComponentProps<BackupViewerTabParams, VoidTabData>>()
const emit = defineEmits<TabComponentEvents>()

const taskListRef = ref<typeof TaskList>()
const backupListRef = ref<typeof BackupList>()

const path: List<string> = List([t('backupViewer.title')])

const backupsInPreparationPresent = ref<boolean>(false)

function reloadBackups(): void {
    reloadTasks()
    backupListRef.value?.reload(true)
}

function reloadTasks(): void {
    taskListRef.value?.reload(true)
}

emit('ready')
</script>

<template>
    <div class="backup-viewer">
        <VTabToolbar prepend-icon="mdi-cloud-download-outline" :path="path">
            <template #append>
                <VBtn icon @click="reloadBackups">
                    <VIcon>mdi-refresh</VIcon>
                    <VTooltip activator="parent">
                        {{ t('backupViewer.button.reloadBackups') }}
                    </VTooltip>
                </VBtn>
                <RestoreLocalBackupFileButton
                    :connection="params.connection"
                    @restore="reloadBackups"
                />
                <BackupCatalogButton
                    :connection="params.connection"
                    @backup="reloadBackups"
                />
            </template>
        </VTabToolbar>

        <VSheet class="backup-viewer__body">
            <TaskList
                ref="taskListRef"
                v-show="backupsInPreparationPresent"
                :connection="params.connection"
                :subheader="t('backupViewer.tasks.title')"
                :states="shownTaskStates"
                :task-types="shownTaskTypes"
                :page-size="5"
                hideable-pagination
                @update:active-jobs-present="backupsInPreparationPresent = $event"
            />

            <BackupList
                ref="backupListRef"
                :connection="params.connection"
                :backups-in-preparation-present="backupsInPreparationPresent"
                @request-task-update="reloadTasks"
            />
        </VSheet>
    </div>
</template>

<style lang="scss" scoped>
.backup-viewer {
    display: grid;
    grid-template-rows: 3rem 1fr;

    &__body {
        position: absolute;
        left: 0;
        right: 0;
        top: 3rem;
        bottom: 0;
        overflow-y: auto;
    }
}
</style>
