import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Ref } from 'vue'
import { TabDefinition } from '@/modules/workspace/tab/model/TabDefinition'
import type { TabData } from '@/modules/workspace/tab/model/TabData'
import { SubjectPathStatus } from '@/modules/workspace/status-bar/model/subject-path-status/SubjectPathStatus'
import { EditorStatus } from '@/modules/workspace/status-bar/model/editor-status/EditorStatus'

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
    const editorStatus: Ref<EditorStatus> = ref<EditorStatus>(new EditorStatus())

    return {
        tabDefinitions,
        tabData,
        tabHistory,
        subjectPathStatus,
        editorStatus
    }
})

export type WorkspaceStore = ReturnType<typeof useWorkspaceStore>
