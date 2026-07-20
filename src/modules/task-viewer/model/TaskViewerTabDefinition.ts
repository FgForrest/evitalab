import { TabDefinition } from '@/modules/workspace/tab/model/TabDefinition'
import { VoidTabData } from '@/modules/workspace/tab/model/void/VoidTabData'
import { markRaw } from 'vue'
import type {  } from 'vue'
import { TaskViewerTabParams } from '@/modules/task-viewer/model/TaskViewerTabParams'
import TaskViewer from '@/modules/task-viewer/components/TaskViewer.vue'

export class TaskViewerTabDefinition extends TabDefinition<TaskViewerTabParams, VoidTabData> {
    constructor(title: string, params: TaskViewerTabParams) {
        super(
            undefined,
            title,
            TaskViewerTabDefinition.icon(),
            markRaw(TaskViewer as Component),
            params,
            new VoidTabData()
        )
    }

    static icon(): string {
        return 'mdi-chart-gantt'
    }
}
