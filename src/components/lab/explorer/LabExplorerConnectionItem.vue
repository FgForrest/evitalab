<script setup lang="ts">
import LabExplorerCatalogItem from './LabExplorerCatalogItem.vue'

import { EvitaDBConnection, UnexpectedError } from '@/model/lab'
import { provide, readonly, ref } from 'vue'
import { LabService, useLabService } from '@/services/lab.service'
import VTreeViewItem from '@/components/base/VTreeViewItem.vue'
import { Catalog } from '@/model/evitadb'
import { Toaster, useToaster } from '@/services/editor/toaster'
import LabExplorerConnectionRemoveDialog from './LabExplorerConnectionRemoveDialog.vue'
import { EditorService, useEditorService } from '@/services/editor/editor.service'
import VTreeViewItemEmpty from '@/components/base/VTreeViewItemEmpty.vue'
import { GraphQLConsoleRequest } from '@/model/editor/tab/graphQLConsole/GraphQLConsoleRequest'
import { GraphQLInstanceType } from '@/model/editor/tab/graphQLConsole/GraphQLInstanceType'

enum ActionType {
    OpenGraphQLSystemAPIConsole = 'open-graphql-system-api-console',
    Edit = 'edit',
    Remove = 'remove'
}

const editorService: EditorService = useEditorService()
const labService: LabService = useLabService()
const toaster: Toaster = useToaster()

const props = defineProps<{
    connection: EvitaDBConnection
}>()

provide('connection', readonly(props.connection))

const actions = ref<object[]>([
    {
        value: ActionType.OpenGraphQLSystemAPIConsole,
        title: 'Open GraphQL System API console',
        props: {
            prependIcon: 'mdi-graphql'
        }
    }
])
if (!labService.isReadOnly() && !props.connection.preconfigured) {
    // actions.value.push({
    //     value: ActionType.Edit,
    //     title: 'Edit connection',
    //     props: {
    //         prependIcon: 'mdi-pencil'
    //     }
    // })
    actions.value.push({
        value: ActionType.Remove,
        title: 'Remove connection',
        props: {
            prependIcon: 'mdi-delete'
        }
    })
}
const removeConnectionDialogOpen = ref<boolean>(false)
const catalogs = ref<Catalog[]>()
const loading = ref<boolean>(false)

async function loadCatalogs(): Promise<void> {
    if (catalogs.value !== undefined) {
        return
    }

    loading.value = true
    try {
        catalogs.value = await labService.getCatalogs(props.connection)
    } catch (e: any) {
        toaster.error(e)
    }
    loading.value = false
}

function handleAction(action: string, payload?: any) {
    switch (action) {
        case ActionType.OpenGraphQLSystemAPIConsole:
            editorService.createTab(
                GraphQLConsoleRequest.createNew(
                    props.connection,
                    'system', // todo lho: this is not needed
                    GraphQLInstanceType.System
                )
            )
            break
        case ActionType.Edit:
            throw new UnexpectedError(undefined, 'Not implemented yet.')
        case ActionType.Remove:
            removeConnectionDialogOpen.value = true
            break
    }
}
</script>

<template>
    <VListGroup
        :value="connection.name"
    >
        <template #activator="{ isOpen, props }">
            <VTreeViewItem
                v-bind="props"
                openable
                :is-open="isOpen"
                prepend-icon="mdi-power-plug-outline"
                :loading="loading"
                :actions="actions"
                @click="loadCatalogs"
                @click:action="handleAction"
                class="font-weight-bold"
            >
                {{ connection.name }}
                <VTooltip activator="parent">
                    {{ connection.name }}
                </VTooltip>
            </VTreeViewItem>
        </template>

        <div
            v-if="catalogs !== undefined"
        >
            <template v-if="catalogs.length > 0">
                <LabExplorerCatalogItem
                    v-for="catalog in catalogs"
                    :key="catalog.name"
                    :catalog="catalog"
                />
            </template>
            <template v-else>
                <VTreeViewItemEmpty />
            </template>
        </div>

        <LabExplorerConnectionRemoveDialog
            v-model="removeConnectionDialogOpen"
            :connection="connection"
        />
    </VListGroup>
</template>

<style lang="scss" scoped>

</style>
