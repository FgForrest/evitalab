<script setup lang="ts">

import { onMounted, onUnmounted, ref, watch } from 'vue'
import { EditorService, useEditorService } from '@/services/editor/editor.service'
import LabEditorTabWindow from './tab/LabEditorTabWindow.vue'
import { ellipsis } from '@/utils/text-utils'
import LabEditorWelcomeScreen from './LabEditorWelcomeScreen.vue'
import { RouteLocationNormalizedLoaded, useRoute } from 'vue-router'
import { useToaster } from '@/services/editor/toaster'
import { DemoSnippetResolver, useDemoSnippetResolver } from '@/services/editor/demo-snippet-resolver.service'
import { SharedTabResolver, useSharedTabResolver } from '@/services/editor/shared-tab-resolver.service'
import LabEditorTabSharedDialog from '@/components/lab/editor/tab/LabEditorTabSharedDialog.vue'
import { Keymap, useKeymap } from '@/model/editor/keymap/Keymap'
import { TabRequest } from '@/model/editor/tab/TabRequest'
import { TabRequestComponentData } from '@/model/editor/tab/TabRequestComponentData'
import { Command } from '@/model/editor/keymap/Command'
import VActionTooltip from '@/components/base/VActionTooltip.vue'

const currentRoute: RouteLocationNormalizedLoaded = useRoute()
const toaster = useToaster()
const keymap: Keymap = useKeymap()
const editorService: EditorService = useEditorService()
const demoCodeSnippetResolver: DemoSnippetResolver = useDemoSnippetResolver()
const sharedTabResolver: SharedTabResolver = useSharedTabResolver()

/**
 * Represents editor mode where user data aren't stored at the end of the session. Useful for demo snippets or shared tabs.
 */
const playgroundMode = ref<boolean>(false)

const sharedTabDialogOpen = ref<boolean>(false)
const sharedTabRequest = ref<TabRequest<any, any> | undefined>()

const tabs = ref<TabRequest<any, any>[]>(editorService.getTabs())
watch(tabs, () => {
    // switch to newly opened tab
    const newTab: TabRequest<any, any> | undefined = editorService.getNewTab()
    if (newTab) {
        currentTabId.value = newTab.id
        editorService.markTabAsVisited(newTab.id)
    }
}, { deep: true })
const currentTabId = ref<string | null>()
watch(currentTabId, (newTabId, oldTabId) => {
    if (newTabId != undefined) {
        keymap.setContext(newTabId)
    } else if (oldTabId != undefined) {
        // no more tabs
        keymap.resetActivatedContext()
    }
})
let currentTabData: Map<string, TabRequestComponentData<any>> = new Map<string, TabRequestComponentData<any>>()

function storeTabData(tabId: string, updatedData: TabRequestComponentData<any>) {
    currentTabData.set(tabId, updatedData)
}

function moveTabCursor(diff: number) {
    if (currentTabId.value == undefined) {
        return
    }

    const currentTabIndex: number = editorService.getTabIndex(currentTabId.value as string)
    let newTabIndex: number = currentTabIndex + diff
    if (newTabIndex < 0) {
        newTabIndex = tabs.value.length - 1
    } else if (newTabIndex >= tabs.value.length) {
        newTabIndex = 0
    }
    currentTabId.value = tabs.value[newTabIndex].id
}

function closeTab(tabId: string) {
    const prevTabsLength: number = tabs.value.length
    const prevTabIndex: number = tabs.value.findIndex(tab => tab.id === currentTabId.value)
    const closedTabIndex: number = tabs.value.findIndex(tab => tab.id === tabId)

    editorService.destroyTab(tabId)
    keymap.deleteContext(tabId)

    if (tabs.value.length === 0) {
        currentTabId.value = null
    } else if (closedTabIndex === prevTabIndex && closedTabIndex === prevTabsLength - 1) {
        currentTabId.value = tabs.value[closedTabIndex - 1].id
    } else if (closedTabIndex === prevTabIndex && closedTabIndex < prevTabsLength - 1) {
        currentTabId.value = tabs.value[closedTabIndex].id
    }
}

/**
 * open demo code snippet if requested
 */
async function resolveDemoCodeSnippet(): Promise<TabRequest<any, any> | undefined> {
    const demoSnippetRequestSerialized: string | undefined = currentRoute.query.demoSnippetRequest as string | undefined
    if (demoSnippetRequestSerialized == undefined) {
        return undefined
    }

    try {
        return await demoCodeSnippetResolver.resolve(demoSnippetRequestSerialized)
    } catch (e: any) {
        toaster.error(e)
    }
}

/**
 * Open shared tab if requested
 */
async function resolveSharedTab(): Promise<TabRequest<any, any> | undefined> {
    const sharedTabSerialized: string | undefined = currentRoute.query.sharedTab as string | undefined
    if (sharedTabSerialized == undefined) {
        return undefined
    }

    try {
        return await sharedTabResolver.resolve(sharedTabSerialized)
    } catch (e: any) {
        toaster.error(e)
    }
}

function restorePreviousSession(): void {
    try {
        let sessionRestored: boolean = false

        const restoredTabData: Map<string, TabRequestComponentData<any>> | undefined = editorService.createTabsForTabsFromLastSession()
        if (restoredTabData != undefined) {
            currentTabData = restoredTabData
            sessionRestored = true
        }

        const tabHistoryRestored: boolean = editorService.restoreTabHistory()
        if (tabHistoryRestored) {
            sessionRestored = true
        }

        if (sessionRestored) {
            toaster.info('Your last session has been restored.')
        }
    } catch (e) {
        console.error(e)
        toaster.warning('Failed to fully restore your last session.')
    }
}

function storeCurrentSession() {
    editorService.storeOpenedTabs(currentTabData)
    editorService.storeTabHistory()
}

// initialize the editor
resolveDemoCodeSnippet()
    .then(tabRequest => {
        if (tabRequest != undefined) {
            playgroundMode.value = true
            editorService.createTab(tabRequest)
        }
        return resolveSharedTab()
    }).then(tabRequest => {
        if (tabRequest != undefined) {
            playgroundMode.value = true
            sharedTabRequest.value = tabRequest
            sharedTabDialogOpen.value = true
        }

        if (!playgroundMode.value) {
            restorePreviousSession()
        }
    })

onMounted(() => {
    keymap.bindGlobal(Command.System_Editor_PreviousTab, () => moveTabCursor(-1))
    keymap.bindGlobal(Command.System_Editor_NextTab, () => moveTabCursor(1))
    keymap.bindGlobal(Command.System_Editor_CloseTab, () => {
        if (currentTabId.value != undefined) {
            closeTab(currentTabId.value as string)
        }
    })
    keymap.bindGlobal(Command.System_Editor_CloseAllTabs, () => editorService.destroyAllTabs())
})
onUnmounted(() => {
    keymap.unbindGlobal(Command.System_Editor_PreviousTab)
    keymap.unbindGlobal(Command.System_Editor_NextTab)
    keymap.unbindGlobal(Command.System_Editor_CloseTab)
    keymap.unbindGlobal(Command.System_Editor_CloseAllTabs)
})

window.addEventListener('beforeunload', () => {
    if (!playgroundMode.value) {
        storeCurrentSession()
    }
})
</script>

<template>
    <VAppBar
        v-if="tabs.length > 0"
        density="compact"
        elevation="0"
    >
        <VTabs v-model="currentTabId">
            <VTab
                v-for="tab in tabs"
                :key="tab.id"
                :value="tab.id"
                :prepend-icon="tab.icon"
                @mousedown.middle="closeTab(tab.id)"
                class="lab-tab"
            >
                <span>
                    {{ ellipsis(tab.title, 30) }}

                    <VTooltip
                        v-if="tab.title.length > 30"
                        activator="parent"
                    >
                        {{ tab.title }}
                    </VTooltip>
                </span>

                <VBtn
                    icon
                    variant="plain"
                    density="compact"
                    class="ml-3"
                    @click.stop="closeTab(tab.id)"
                >
                    <VIcon>mdi-close</VIcon>
                    <VActionTooltip :command="Command.System_Editor_CloseTab">
                        Close tab
                    </VActionTooltip>
                </VBtn>
            </VTab>
        </VTabs>
    </VAppBar>

    <VMain
        :scrollable="false"
        class="lab-editor"
    >
        <VWindow
            v-if="tabs.length > 0"
            v-model="currentTabId"
        >
            <VWindowItem
                v-for="tab in tabs"
                :key="tab.id"
                :value="tab.id"
                :transition="false"
                :reverse-transition="false"
                class="window-item"
            >
                <LabEditorTabWindow
                    :component="tab.component"
                    :component-props="tab.componentProps()"
                    @data-update="storeTabData(tab.id, $event)"
                />
            </VWindowItem>
        </VWindow>
        <div v-else style="position: relative">
            <LabEditorWelcomeScreen/>
        </div>
    </VMain>

    <LabEditorTabSharedDialog
        v-if="sharedTabRequest"
        :tab-request="sharedTabRequest"
        @resolve="sharedTabRequest = undefined"
    />
</template>

<style scoped>

.lab-editor {
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: 1fr;
    justify-items: stretch;
    align-items: stretch;

    & :deep(.v-window) {
        position: absolute;
        left: var(--v-layout-left);
        right: var(--v-layout-right);
        top: var(--v-layout-top);
        bottom: var(--v-layout-bottom);
    }

    & :deep(.v-window__container) {
        position: absolute;
        left: 0;
        right: 0;
        top: 0;
        bottom: 0;
    }

    & :deep(.v-window-item) {
        display: grid;
        grid-template-columns: 1fr;
        grid-template-rows: 1fr;
        align-items: stretch;
        justify-items: stretch;

        position: absolute;
        left: 0;
        right: 0;
        top: 0;
        bottom: 0;
    }
}
</style>
