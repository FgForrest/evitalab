<script setup lang="ts">

import VLabDialog from '@/modules/base/component/VLabDialog.vue'
import { useI18n } from 'vue-i18n'
import { TaskStatus } from '@/modules/connection/model/task/TaskStatus'
import VPropertiesTable from '@/modules/base/component/VPropertiesTable.vue'
import { computed, onUnmounted, ref } from 'vue'
import { Property } from '@/modules/base/model/properties-table/Property'
import { PropertyValue } from '@/modules/base/model/properties-table/PropertyValue'
import { KeywordValue } from '@/modules/base/model/properties-table/KeywordValue'
import { Duration } from 'luxon'
import { ProgressValue } from '@/modules/base/model/properties-table/ProgressValue'
import { taskStateToColorMapping } from '@/modules/task-viewer/model/taskStateToColorMapping'
import { PlaceholderValue } from '@/modules/base/model/properties-table/PlaceholderValue'
import { TaskTrait } from '@/modules/connection/model/task/TaskTrait'
import { TaskState } from '@/modules/connection/model/task/TaskState'

const { t } = useI18n()

const props = defineProps<{
    modelValue: boolean
    task: TaskStatus
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
}>()

const taskColor = computed<string | undefined>(() => {
    const color: string | undefined = taskStateToColorMapping.get(props.task.state)
    if (color != undefined && color.length > 0) {
        return color
    }
    return undefined
})

const taskDuration = ref<Duration | undefined>(props.task.duration)
let taskDurationRefreshTimeoutId: ReturnType<typeof setTimeout> | undefined = undefined
function refreshDuration(): void {
    taskDuration.value = props.task.duration
    if (props.task.finished == undefined) {
        // when task is finished we have nothing to update anymore
        taskDurationRefreshTimeoutId = setTimeout(refreshDuration, 1000)
    }
}
taskDurationRefreshTimeoutId = setTimeout(refreshDuration, 1000)

const properties = computed<Property[]>(() => {
    const properties: Property[] = []
    properties.push(new Property(
        t('taskViewer.tasksVisualizer.task.detail.property.id'),
        new PropertyValue(props.task.taskId.code)
    ))
    properties.push(new Property(
        t('taskViewer.tasksVisualizer.task.detail.property.types'),
        props.task.taskTypes
            .map(taskType => new PropertyValue(new KeywordValue(taskType)))
    ))
    properties.push(new Property(
        t('taskViewer.tasksVisualizer.task.detail.property.name'),
        new PropertyValue(props.task.taskName)
    ))
    properties.push(new Property(
        t('taskViewer.tasksVisualizer.task.detail.property.state'),
        new PropertyValue(new KeywordValue(
            t(`taskViewer.tasksVisualizer.task.state.${props.task.state}`),
            taskColor.value
        ))
    ))
    if (props.task.catalogName != undefined) {
        properties.push(new Property(
            t('taskViewer.tasksVisualizer.task.detail.property.catalogName'),
            new PropertyValue(props.task.catalogName)
        ))
    }
    properties.push(new Property(
        t('taskViewer.tasksVisualizer.task.detail.property.created'),
        new PropertyValue(props.task.created.getPrettyPrintableString())
    ))
    properties.push(new Property(
        t('taskViewer.tasksVisualizer.task.detail.property.issued.label'),
        new PropertyValue(
            props.task.issued != undefined
                ? props.task.issued.getPrettyPrintableString()
                : new PlaceholderValue(t('taskViewer.tasksVisualizer.task.detail.property.issued.notIssued'))
        )
    ))
    properties.push(new Property(
        t('taskViewer.tasksVisualizer.task.detail.property.started.label'),
        new PropertyValue(
            props.task.started != undefined
                ? props.task.started.getPrettyPrintableString()
                : new PlaceholderValue(t('taskViewer.tasksVisualizer.task.detail.property.started.notStarted'))
        )
    ))
    properties.push(new Property(
        t('taskViewer.tasksVisualizer.task.detail.property.finished.label'),
        new PropertyValue(
            props.task.finished != undefined
                ? props.task.finished.getPrettyPrintableString()
                : props.task.started != undefined
                    ? new PlaceholderValue(t('taskViewer.tasksVisualizer.task.detail.property.finished.notFinished'))
                    : new PlaceholderValue(t('taskViewer.tasksVisualizer.task.detail.property.finished.notStarted'))
        )
    ))
    properties.push(new Property(
        t('taskViewer.tasksVisualizer.task.detail.property.duration.label'),
        new PropertyValue(
            taskDuration.value != undefined
                ? taskDuration.value.toHuman()
                : new PlaceholderValue(t('taskViewer.tasksVisualizer.task.detail.property.duration.notStarted'))
        )
    ))
    properties.push(new Property(
        t('taskViewer.tasksVisualizer.task.detail.property.progress'),
        new PropertyValue(new ProgressValue(
            props.task.progress,
            props.task.state === TaskState.Running &&
                (
                    !props.task.traits.contains(TaskTrait.CanBeCancelled) ||
                    props.task.traits.contains(TaskTrait.NeedsToBeStopped)
                )
        ))
    ))
    properties.push(new Property(
        t('taskViewer.tasksVisualizer.task.detail.property.settings'),
        new PropertyValue(props.task.settings)
    ))
    properties.push(new Property(
        t('taskViewer.tasksVisualizer.task.detail.property.traits'),
        props.task.traits
            .map(trait => new PropertyValue(new KeywordValue(
                t(`taskViewer.tasksVisualizer.task.trait.${trait}`)
            )))
            .toList()
    ))
    return properties
})

onUnmounted(() => clearTimeout(taskDurationRefreshTimeoutId))
</script>

<template>
    <VLabDialog
        :model-value="modelValue"
        scrollable
        max-width="50rem"
        @update:model-value="emit('update:modelValue', $event)"
    >
        <template #activator="{ props }">
            <slot name="activator" v-bind="{ props }"/>
        </template>

        <template #title>
            {{ t('taskViewer.tasksVisualizer.task.detail.title') }}
        </template>

        <template #default>
            <VPropertiesTable :properties="properties" />
        </template>
    </VLabDialog>
</template>

<style lang="scss" scoped>

</style>
