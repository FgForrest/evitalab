<script setup lang="ts">
/**
 * Visualizes server tasks
 */

import { Connection } from '@/modules/connection/model/Connection'
import { TaskViewerService, useTaskViewerService } from '../services/TaskViewerService'
import { computed, onUnmounted, ref, watch } from 'vue'
import { TaskState } from '@/modules/connection/model/task/TaskState'
import { TaskStatus } from '@/modules/connection/model/task/TaskStatus'
import { Toaster, useToaster } from '@/modules/notification/service/Toaster'
import { useI18n } from 'vue-i18n'
import { PaginatedList } from '@/modules/connection/model/PaginatedList'
import TaskListItem from '@/modules/task-viewer/components/TaskListItem.vue'
import VListItemDivider from '@/modules/base/component/VListItemDivider.vue'
import VMissingDataIndicator from '@/modules/base/component/VMissingDataIndicator.vue'

const taskViewerService: TaskViewerService = useTaskViewerService()
const toaster: Toaster = useToaster()
const { t } = useI18n()

const props = withDefaults(
    defineProps<{
        subheader?: string,
        connection: Connection
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
    (e: 'update:activeJobsPresent', value: boolean): void
}>()

const pageNumber = ref<number>(1)
watch(pageNumber, async () => {
    await loadTaskStatuses()
})
const pageCount = computed<number>(() => {
    if (taskStatuses.value == undefined) {
        return 1
    }
    return Math.ceil(taskStatuses.value.totalNumberOfRecords / props.pageSize)
})

const taskStatuses = ref<PaginatedList<TaskStatus>>()
watch(taskStatuses, async (newValue) => {
    if (newValue != undefined && newValue.data.size > 0) {
        emit('update:activeJobsPresent', true)
    } else {
        emit('update:activeJobsPresent', false)
    }
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

async function loadTaskStatuses(): Promise<boolean> {
    try {
        taskStatuses.value = await taskViewerService.getTaskStatuses(
            props.connection,
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
        return true
    } catch (e: any) {
        await toaster.error(t(
            'taskViewer.tasksVisualizer.notification.couldNotLoadTaskStatuses',
            { reason: e.message }
        ))
        return false
    }
}

let canReload: boolean = true
let reloadTimeoutId: ReturnType<typeof setTimeout> | undefined = undefined
async function reload(manual: boolean = false): Promise<void> {
    if (!canReload && !manual) {
        return
    }

    const loaded: boolean = await loadTaskStatuses()
    if (loaded) {
        if (manual && canReload) {
            // do nothing if the reloading process is working and user
            // requests additional reload in between
        } else {
            // set new timeout only for automatic reload or reload recovery
            reloadTimeoutId = setTimeout(reload, 2000)
        }
        canReload = true
    } else {
        // we don't want to spam user server is down, user needs to refresh manually
        canReload = false
    }
}

loadTaskStatuses().then(() => {
    reloadTimeoutId = setTimeout(reload, 2000)
})
onUnmounted(() => clearTimeout(reloadTimeoutId))

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
                    <TaskListItem
                        :connection="connection"
                        :task="item.raw"
                    >
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
