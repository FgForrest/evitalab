import { TabDefinition } from '@/modules/workspace/tab/model/TabDefinition'
import { VoidTabData } from '@/modules/workspace/tab/model/void/VoidTabData'
import { DefineComponent, markRaw } from 'vue'
import { TaskViewerTabParams } from '@/modules/task-viewer/model/TaskViewerTabParams'
import TaskViewer from '@/modules/task-viewer/components/TaskViewer.vue'

export class TaskViewerTabDefinition extends TabDefinition<TaskViewerTabParams, VoidTabData> {
    constructor(title: string, params: TaskViewerTabParams) {
        super(
            undefined,
            title,
            TaskViewerTabDefinition.icon(),
            markRaw(TaskViewer as DefineComponent<any, any, any>),
            params,
            new VoidTabData()
        )
    }

    static icon(): string {
        return 'mdi-chart-gantt'
    }
}
