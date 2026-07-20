import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Ref } from 'vue'
import type { AnyTabDefinition } from '@/modules/workspace/tab/model/TabDefinition'
import type { AnyTabData } from '@/modules/workspace/tab/model/TabData'
import { SubjectPathStatus } from '@/modules/workspace/status-bar/model/subject-path-status/SubjectPathStatus'
import { EditorStatus } from '@/modules/workspace/status-bar/model/editor-status/EditorStatus'

/**
 * Defines Pinia store for entire workspace
 */
export const useWorkspaceStore = defineStore('workspace', () => {
    // tabs
    const tabDefinitions: Ref<AnyTabDefinition[]> = ref<AnyTabDefinition[]>([])
    const tabData: Ref<Map<string, AnyTabData>> = ref<Map<string, AnyTabData>>(new Map())
    const tabHistory: Ref<Map<string, unknown[]>> = ref<Map<string, unknown[]>>(new Map())

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
