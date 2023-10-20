<script setup lang="ts">
/**
 * EvitaQL console. Allows to execute EvitaQL queries against a evitaDB instance.
 */

import { Splitpanes, Pane } from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'

import { Extension } from '@codemirror/state';
import { json } from '@codemirror/lang-json'

import { ref } from 'vue'
import CodemirrorFull from '@/components/base/CodemirrorFull.vue'
import { EvitaQLConsoleService, useEvitaQLConsoleService } from '@/services/editor/evitaql-console.service'
import { EvitaQLConsoleData, EvitaQLConsoleParams } from '@/model/editor/evitaql-console'
import { Toaster, useToaster } from '@/services/editor/toaster'
import { TabComponentEvents, TabComponentProps } from '@/model/editor/editor'
import VExecuteQueryButton from '@/components/base/VExecuteQueryButton.vue'
import VTabToolbar from '@/components/base/VTabToolbar.vue'
import VSideTabs from '@/components/base/VSideTabs.vue'

const evitaQLConsoleService: EvitaQLConsoleService = useEvitaQLConsoleService()
const toaster: Toaster = useToaster()

const props = defineProps<TabComponentProps<EvitaQLConsoleParams, EvitaQLConsoleData>>()
const emit = defineEmits<TabComponentEvents>()

const path = ref<string[]>([
    props.params.dataPointer.catalogName
])
const editorTab = ref<string>('query')

const queryCode = ref<string>(props.data?.query ? props.data.query : `// Write your EvitaQL query for catalog ${props.params.dataPointer.catalogName} here.\n`)
const queryExtensions = ref<any[]>([])

const variablesCode = ref<string>(props.data?.variables ? props.data.variables : '{\n  \n}')
const variablesExtensions: Extension[] = [json()]

const resultCode = ref<string>('')
const resultExtensions: Extension[] = [json()]

async function executeQuery(): Promise<void> {
    try {
        resultCode.value = await evitaQLConsoleService.executeEvitaQLQuery(props.params.dataPointer, queryCode.value, JSON.parse(variablesCode.value))
    } catch (error: any) {
        toaster.error(error)
    }
}

emit('ready')

if (props.params.executeOnOpen) {
    executeQuery()
}
</script>

<template>
    <div class="evitaql-editor">
        <VTabToolbar
            prepend-icon="mdi-application-braces-outline"
            :path="path"
        >
            <template #append>
                <VExecuteQueryButton @click="executeQuery" />
            </template>
        </VTabToolbar>

        <div class="evitaql-editor__body">
            <VSheet class="evitaql-editor-query-sections">
                <VSideTabs
                    v-model="editorTab"
                    side="left"
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
                </VSideTabs>

                <VDivider class="mt-2 mb-2" />
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
}

.v-slide-group {
    & :deep(.v-tab) {

        &:hover {
            color: var(--el-color-primary-lightest);
        }

        &.v-tab--selected {
            color: var(--el-color-primary-lightest);
        }

    }
}
</style>
