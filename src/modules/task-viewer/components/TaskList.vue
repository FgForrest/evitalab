<script setup lang="ts">
import { errorMessage } from '@/utils/error'
/**
 * Visualizes server tasks
 */

import { TaskViewerService, useTaskViewerService } from '../services/TaskViewerService'
import { computed, ref, watch } from 'vue'
import { TaskState } from '@/modules/database-driver/request-response/task/TaskState'
import { TaskStatus } from '@/modules/database-driver/request-response/task/TaskStatus'
import { useToaster } from '@/modules/notification/service/Toaster'
import type { Toaster } from '@/modules/notification/service/Toaster'
import { useI18n } from 'vue-i18n'
import { PaginatedList } from '@/modules/database-driver/request-response/PaginatedList'
import TaskListItem from '@/modules/task-viewer/components/TaskListItem.vue'
import VListItemDivider from '@/modules/base/component/VListItemDivider.vue'
import VMissingDataIndicator from '@/modules/base/component/VMissingDataIndicator.vue'
import { useAutoReload } from '@/modules/viewer-support/composable/useAutoReload'

const reloadInterval: number = 2000

const taskViewerService: TaskViewerService = useTaskViewerService()
const toaster: Toaster = useToaster()
const { t } = useI18n()

const props = withDefaults(
    defineProps<{
        subheader?: string,
        states?: TaskState[]
        taskTypes?: string[],
        pageSize?: number,
        hideablePagination?: boolean,
    }>(),
    {
        pageSize: 20,
        hideablePagination: false
    }
)
const emit = defineEmits<{
    (e: 'update:activeJobsPresent', value: boolean): void,
    (e: 'update:tasks', value: TaskStatus[]): void
}>()

const pageNumber = ref<number>(1)
watch(pageNumber, async () => {
    await reload(true)
})
const pageCount = computed<number>(() => {
    if (taskStatuses.value == undefined) {
        return 1
    }
    return Math.ceil(taskStatuses.value.totalNumberOfRecords / props.pageSize)
})

const taskStatuses = ref<PaginatedList<TaskStatus>>()
watch(taskStatuses, async (newValue) => {
    const tasks: TaskStatus[] = newValue?.data.toArray() ?? []
    emit('update:tasks', tasks)
    emit('update:activeJobsPresent', tasks.length > 0)
})
const taskStatusesItems = computed<TaskStatus[]>(() => {
    if (taskStatuses.value == undefined) {
        return []
    }
    return taskStatuses.value.data.toArray()
})
const loadedTaskStatuses = ref<boolean>(false)
const shouldDisplayPagination = computed<boolean>(() => {
    if (!props.hideablePagination) {
        return true
    }
    if (taskStatuses.value == undefined) {
        return false
    }
    return taskStatuses.value.totalNumberOfRecords > props.pageSize
})

async function loadTaskStatuses(): Promise<void> {
    taskStatuses.value = await taskViewerService.getTaskStatuses(
        pageNumber.value,
        props.pageSize,
        props.states,
        props.taskTypes
    )

    if (taskStatuses.value.pageNumber > 1 && taskStatuses.value?.data.size === 0) {
        pageNumber.value--
    }
    if (!loadedTaskStatuses.value) {
        loadedTaskStatuses.value = true
    }
}

const { reload } = useAutoReload(
    loadTaskStatuses,
    reloadInterval,
    (e: unknown) => {
        toaster.error(t(
            'taskViewer.tasksVisualizer.notification.couldNotLoadTaskStatuses',
            { reason: errorMessage(e) }
        )).then()
    }
)

defineExpose<{
    reload(manual: boolean): Promise<void>
}>({
    reload
})
</script>

<template>
    <VList v-if="loadedTaskStatuses && taskStatusesItems.length > 0">
        <VListSubheader v-if="subheader !== undefined && subheader.length > 0">
            {{ subheader }}
        </VListSubheader>

        <VDataIterator
            :items="taskStatusesItems"
            :page="pageNumber"
            :items-per-page="pageSize"
        >
            <template #default="{ items }">
                <template v-for="(item, index) in items" :key="item.raw.taskId.code">
                    <TaskListItem :task="item.raw">
                        <template #append-action-buttons="{ task }">
                            <slot name="item-append-action-buttons" :task="task"/>
                        </template>
                    </TaskListItem>

                    <VListItemDivider
                        v-if="index < taskStatusesItems.length - 1"
                        inset
                    />
                </template>
            </template>

            <template #footer>
                <VPagination
                    v-if="shouldDisplayPagination"
                    v-model="pageNumber"
                    :length="pageCount"
                />
            </template>
        </VDataIterator>
    </VList>

    <VMissingDataIndicator
        v-else
        icon="mdi-chart-gantt"
        :title="t('taskViewer.tasksVisualizer.noTasks')"
    />
</template>

<style lang="scss" scoped>

</style>
