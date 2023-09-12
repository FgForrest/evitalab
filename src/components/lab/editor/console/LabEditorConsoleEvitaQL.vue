<script setup lang="ts">
import { Splitpanes, Pane } from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'

import { Extension } from '@codemirror/state';
import { json } from '@codemirror/lang-json'

import { ref } from 'vue'
import CodemirrorFull from '@/components/base/CodemirrorFull.vue'
import { EvitaQLConsoleService, useEvitaQLConsoleService } from '@/services/editor/evitaql-console.service'
import { EvitaQLConsoleProps } from '@/model/editor/evitaql-console'
import { Toaster, useToaster } from '@/services/editor/toaster'

const evitaQLConsoleService: EvitaQLConsoleService = useEvitaQLConsoleService()
const toaster: Toaster = useToaster()

const props = defineProps<EvitaQLConsoleProps>()

const path = ref<string[]>([
    props.dataPointer.catalogName
])
const editorTab = ref<string>('query')

const queryCode = ref<string>(`// Write your EvitaQL query for catalog ${props.dataPointer.catalogName} here.\n`)
const queryExtensions = ref<any[]>([])

const variablesCode = ref<string>('{\n  \n}')
const variablesExtensions: Extension[] = [json()]

const resultCode = ref<string>('')
const resultExtensions: Extension[] = [json()]


async function executeQuery(): Promise<void> {
    try {
        resultCode.value = await evitaQLConsoleService.executeEvitaQLQuery(props.dataPointer, queryCode.value, JSON.parse(variablesCode.value))
    } catch (error: any) {
        toaster.error(error)
    }
}
</script>

<template>
    <div class="evitaql-editor">
        <VToolbar
            density="compact"
            elevation="2"
            class="evitaql-editor__header"
        >
            <VAppBarNavIcon
                icon="mdi-console"
                :disabled="true"
                style="opacity: 1"
            />

            <VToolbarTitle>
                <VBreadcrumbs
                    :items="path"
                    class="pl-0 pr-0"
                />
            </VToolbarTitle>

            <template #append>
                <!-- todo lho primary color? -->
                <VBtn
                    icon
                    variant="elevated"
                    density="compact"
                    @click="executeQuery"
                >
                    <VIcon>mdi-play</VIcon>

                    <VTooltip activator="parent">
                        Execute query
                    </VTooltip>
                </VBtn>
            </template>
        </VToolbar>

        <div class="evitaql-editor__body">
            <VSheet class="evitaql-editor-query-sections">
                <VTabs
                    v-model="editorTab"
                    direction="vertical"
                    class="evitaql-editor-query-sections__tab"
                >
                    <VTab value="query">
                        <VIcon>mdi-database-search</VIcon>
                        <VTooltip activator="parent">
                            Query
                        </VTooltip>
                    </VTab>
                    <VTab value="variables">
                        <VIcon>mdi-variable</VIcon>
                        <VTooltip activator="parent">
                            Variables
                        </VTooltip>
                    </VTab>
                </VTabs>

                <VDivider />
            </VSheet>

            <Splitpanes vertical>
                <Pane class="evitaql-editor-query">
                    <VWindow
                        v-model="editorTab"
                        direction="vertical"
                    >
                        <VWindowItem value="query">
                            <CodemirrorFull
                                v-model="queryCode"
                                :additional-extensions="queryExtensions"
                                @execute="executeQuery"
                            />
                        </VWindowItem>

                        <VWindowItem value="variables">
                            <CodemirrorFull
                                v-model="variablesCode"
                                :additional-extensions="variablesExtensions"
                                @execute="executeQuery"
                            />
                        </VWindowItem>
                    </VWindow>
                </Pane>

                <Pane>
                    <CodemirrorFull
                        v-model="resultCode"
                        placeholder="Results will be displayed here..."
                        read-only
                        :additional-extensions="resultExtensions"
                    />
                </Pane>
            </Splitpanes>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.evitaql-editor {
    display: grid;
    grid-template-rows: 3rem 1fr;

    &__header {
        z-index: 100;
    }

    &__body {
        display: grid;
        grid-template-columns: 3rem 1fr;
    }
}

.evitaql-editor-query {
    & :deep(.v-window) {
        // we need to override the default tab window styles used in LabEditor
        position: absolute;
        left: 0 !important;
        right: 0 !important;
        top: 0 !important;
        bottom: 0 !important;
    }
}

.evitaql-editor-query-sections {
    display: flex;
    width: 3rem;

    &__tab {
        width: 3rem;
    }
}
</style>
