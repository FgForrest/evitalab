<script setup lang="ts">

import { computed, ref, watch } from 'vue'
import { TabRequest } from '@/model/editor/editor'
import { EditorService, useEditorService } from '@/services/editor/editor.service'
import LabEditorTabWindow from './LabEditorTabWindow.vue'
import { ellipsis } from '@/utils/text-utils'
import LabEditorWelcomeScreen from './LabEditorWelcomeScreen.vue'
import { RouteLocationNormalizedLoaded, useRoute } from 'vue-router'
import { useToaster } from '@/services/editor/toaster'
import { DemoSnippetResolver, useDemoSnippetResolver } from '@/services/editor/demo-snippet-resolver.service'
import { DemoSnippetRequest } from '@/model/editor/demo-snippet-request'

const currentRoute: RouteLocationNormalizedLoaded = useRoute()
const toaster = useToaster()
const editorService: EditorService = useEditorService()
const demoCodeSnippetResolver: DemoSnippetResolver = useDemoSnippetResolver()

const tabs = computed<TabRequest<any, any>[]>(() => {
    return editorService.getTabRequests()
})
watch(tabs, () => {
    // switch to newly opened tab
    const newTab: TabRequest<any, any> | undefined = editorService.getNewTabRequest()
    if (newTab) {
        currentTabId.value = newTab.id
        editorService.markTabRequestAsVisited(newTab.id)
    }
}, { deep: true})

const currentTabId = ref<string | null>()

function closeTab(tabId: string) {
    const prevTabsLength: number = tabs.value.length
    const prevTabIndex: number = tabs.value.findIndex(tab => tab.id === currentTabId.value)
    const closedTabIndex: number = tabs.value.findIndex(tab => tab.id === tabId)
    editorService.destroyTabRequest(tabId)

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
        const demoSnippetRequest: DemoSnippetRequest = JSON.parse(atob(demoSnippetRequestSerialized)) as DemoSnippetRequest
        return await demoCodeSnippetResolver.resolve(demoSnippetRequest)
    } catch (e: any) {
        toaster.error(e)
    }
}
resolveDemoCodeSnippet()
    .then(tabRequest => {
        if (tabRequest) {
            editorService.createTabRequest(tabRequest)
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
                    <VTooltip
                        activator="parent"
                    >
                        Close tab
                    </VTooltip>
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
                />
            </VWindowItem>
        </VWindow>
        <div v-else style="position: relative">
            <LabEditorWelcomeScreen/>
        </div>
    </VMain>
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
