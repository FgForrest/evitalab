<script setup lang="ts">

import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useWorkspaceService, WorkspaceService } from '@/modules/workspace/service/WorkspaceService'
import { TabDefinition } from '@/modules/workspace/tab/model/TabDefinition'
import { Keymap, useKeymap } from '@/modules/keymap/service/Keymap'
import { useToaster } from '@/modules/notification/service/Toaster'
import { DemoSnippetResolver, useDemoSnippetResolver } from '@/modules/workspace/service/DemoSnippetResolver'
import { Command } from '@/modules/keymap/model/Command'
import { ellipsis } from '@/utils/text'
import VActionTooltip from '@/modules/base/component/VActionTooltip.vue'
import TabWindow from '@/modules/workspace/tab/component/TabWindow.vue'
import WelcomeScreen from '@/modules/welcome-screen/component/WelcomeScreen.vue'
import TabSharedDialog from '@/modules/workspace/tab/component/TabSharedDialog.vue'
import { useI18n } from 'vue-i18n'
import { EvitaLabConfig, useEvitaLabConfig } from '@/modules/config/EvitaLabConfig'

const evitaLabConfig: EvitaLabConfig = useEvitaLabConfig()
const toaster = useToaster()
const keymap: Keymap = useKeymap()
const { t } = useI18n()
const workspaceService: WorkspaceService = useWorkspaceService()
const demoCodeSnippetResolver: DemoSnippetResolver = useDemoSnippetResolver()

const showSharedTabDialog = ref<boolean>(false)

const tabDefinitions = ref<TabDefinition<any, any>[]>(workspaceService.getTabDefinitions())
watch(tabDefinitions, () => {
    // switch to newly opened tab
    const newTab: TabDefinition<any, any> | undefined = workspaceService.getTheNewTab()
    if (newTab) {
        currentTabId.value = newTab.id
        workspaceService.markTabAsVisited(newTab.id)
    }
}, { deep: true })
const currentTabId = ref<string | null>()
watch(currentTabId, (newTabId, oldTabId) => {
    if (newTabId != undefined) {
        keymap.setContext(newTabId)
        workspaceService.subjectPathStatus.activatePath(newTabId)
    } else if (oldTabId != undefined) {
        // no more tabs
        keymap.resetActivatedContext()
        workspaceService.subjectPathStatus.deactivatePath()
    }
})

function moveTabCursor(diff: number) {
    if (currentTabId.value == undefined) {
        return
    }

    const currentTabIndex: number = workspaceService.getTabIndex(currentTabId.value as string)
    let newTabIndex: number = currentTabIndex + diff
    if (newTabIndex < 0) {
        newTabIndex = tabDefinitions.value.length - 1
    } else if (newTabIndex >= tabDefinitions.value.length) {
        newTabIndex = 0
    }
    currentTabId.value = tabDefinitions.value[newTabIndex].id
}

function closeTab(tabId: string): void {
    const prevTabsLength: number = tabDefinitions.value.length
    const prevTabIndex: number = tabDefinitions.value.findIndex(tab => tab.id === currentTabId.value)
    const closedTabIndex: number = tabDefinitions.value.findIndex(tab => tab.id === tabId)

    workspaceService.destroyTab(tabId)
    keymap.deleteContext(tabId)
    workspaceService.subjectPathStatus.deletePath(tabId)

    if (tabDefinitions.value.length === 0) {
        currentTabId.value = null
    } else if (closedTabIndex === prevTabIndex && closedTabIndex === prevTabsLength - 1) {
        currentTabId.value = tabDefinitions.value[closedTabIndex - 1].id
    } else if (closedTabIndex === prevTabIndex && closedTabIndex < prevTabsLength - 1) {
        currentTabId.value = tabDefinitions.value[closedTabIndex].id
    }
}

/**
 * open demo code snippet if requested
 */
async function resolveDemoCodeSnippet(urlSearchParams: URLSearchParams): Promise<TabDefinition<any, any> | undefined> {
    const demoSnippetRequestSerialized: string | null = urlSearchParams.get('demoSnippetRequest')
    if (demoSnippetRequestSerialized == undefined) {
        return undefined
    }

    try {
        return await demoCodeSnippetResolver.resolve(demoSnippetRequestSerialized)
    } catch (e: any) {
        await toaster.error('Could not resolve demo code snippet', e) // todo lho i18n
    }
}

async function hasSharedTab(urlSearchParams: URLSearchParams): Promise<boolean> {
    const sharedTabSerialized: string | null = urlSearchParams.get('sharedTab')
    return sharedTabSerialized != undefined
}

function restorePreviousSession(): void {
    try {
        let sessionRestored: boolean = false

        const tabDataRestored: boolean = workspaceService.restoreTabsFromLastSession()
        if (tabDataRestored) {
            sessionRestored = true
        }

        const tabHistoryRestored: boolean = workspaceService.restoreTabHistory()
        if (tabHistoryRestored) {
            sessionRestored = true
        }

        if (sessionRestored) {
            toaster.info('Your last session has been restored.').then()
        }
    } catch (e) {
        console.error(e)
        toaster.warning('Failed to fully restore your last session.').then()
    }
}

// initialize the editor
if (evitaLabConfig.playgroundMode) {
    const urlSearchParams: URLSearchParams = new URLSearchParams(document.location.search)
    resolveDemoCodeSnippet(urlSearchParams)
        .then(tabDefinition => {
            if (tabDefinition != undefined) {
                workspaceService.createTab(tabDefinition)
            }
            return hasSharedTab(urlSearchParams)
        }).then(hasSharedTab => {
            if (hasSharedTab) {
                showSharedTabDialog.value = true
            }
        })
} else {
    restorePreviousSession()
}

onMounted(() => {
    keymap.bindGlobal(Command.System_Editor_PreviousTab, () => moveTabCursor(-1))
    keymap.bindGlobal(Command.System_Editor_NextTab, () => moveTabCursor(1))
    keymap.bindGlobal(Command.System_Editor_CloseTab, () => {
        if (currentTabId.value != undefined) {
            closeTab(currentTabId.value as string)
        }
    })
    keymap.bindGlobal(Command.System_Editor_CloseAllTabs, () => workspaceService.destroyAllTabs())
})
onUnmounted(() => {
    keymap.unbindGlobal(Command.System_Editor_PreviousTab)
    keymap.unbindGlobal(Command.System_Editor_NextTab)
    keymap.unbindGlobal(Command.System_Editor_CloseTab)
    keymap.unbindGlobal(Command.System_Editor_CloseAllTabs)
})
</script>

<template>
    <VAppBar
        v-if="tabDefinitions.length > 0"
        density="compact"
        elevation="0"
    >
        <VTabs v-model="currentTabId">
            <VTab
                v-for="tab in tabDefinitions"
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
                        {{ t('tab.button.closeTab') }}
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
            v-if="tabDefinitions.length > 0"
            v-model="currentTabId"
        >
            <VWindowItem
                v-for="tab in tabDefinitions"
                :key="tab.id"
                :value="tab.id"
                :transition="false"
                :reverse-transition="false"
                class="window-item"
            >
                <TabWindow
                    :id="tab.id"
                    :component="tab.component"
                    :component-props="tab.componentProps()"
                />
            </VWindowItem>
        </VWindow>
        <div v-else style="position: relative">
            <WelcomeScreen/>
        </div>
    </VMain>

    <TabSharedDialog v-model="showSharedTabDialog" />
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
