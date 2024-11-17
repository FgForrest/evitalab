import { defineStore } from 'pinia'
import { ref, Ref } from 'vue'
import { TabDefinition } from '@/modules/workspace/tab/model/TabDefinition'
import { TabData } from '@/modules/workspace/tab/model/TabData'
import { ActiveEditorStatus } from '@/modules/workspace/status-bar/model/editor-status/ActiveEditorStatus'
import { SubjectPathStatus } from '@/modules/workspace/status-bar/model/subject-path-status/SubjectPathStatus'

/**
 * Defines Pinia store for entire workspace
 */
export const useWorkspaceStore = defineStore('workspace', () => {
    // tabs
    const tabDefinitions: Ref<TabDefinition<any, any>[]> = ref<TabDefinition<any, any>[]>([])
    const tabData: Ref<Map<string, TabData<any>>> = ref<Map<string, TabData<any>>>(new Map())
    const tabHistory: Ref<Map<string, any[]>> = ref<Map<string, any[]>>(new Map())

    // status bar
    const subjectPathStatus: Ref<SubjectPathStatus> = ref<SubjectPathStatus>(new SubjectPathStatus())
    const activeEditorStatus: Ref<ActiveEditorStatus | undefined> = ref<ActiveEditorStatus | undefined>(undefined)

    return {
        tabDefinitions,
        tabData,
        tabHistory,
        subjectPathStatus,
        activeEditorStatus
    }
})

export type WorkspaceStore = ReturnType<typeof useWorkspaceStore>
