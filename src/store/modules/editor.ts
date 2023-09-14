import { TabRequest } from '@/model/editor/editor'

export type EditorState = {
    readonly tabsRequests: TabRequest<any, any>[]
}

type EditorMutations = {
    addTabRequest: (state: EditorState, tabRequest: TabRequest<any, any>) => void,
    markTabRequestAsVisited: (state: EditorState, id: string) => void,
    destroyTabRequest: (state: EditorState, id: string) => void
}

const state = (): EditorState => ({
    tabsRequests: []
})

const mutations: EditorMutations = {
    addTabRequest (state, tabRequest): void {
        state.tabsRequests.push(tabRequest)
    },

    markTabRequestAsVisited (state, id): void {
        const tabRequest: TabRequest<any, any> | undefined = state.tabsRequests.find(tabRequest => tabRequest.id === id)
        if (tabRequest) {
            tabRequest.new = false
        }
    },

    destroyTabRequest (state, id): void {
        state.tabsRequests.splice(state.tabsRequests.findIndex(tabRequest => tabRequest.id === id), 1)
    }
}

export default {
    namespaced: true,
    state,
    mutations
}
