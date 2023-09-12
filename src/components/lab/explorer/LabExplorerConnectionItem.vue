<script setup lang="ts">
import LabExplorerCatalogItem from './LabExplorerCatalogItem.vue'

import { EvitaDBConnection, UnexpectedError } from '@/model/lab'
import { provide, readonly, ref } from 'vue'
import { LabService, useLabService } from '@/services/lab.service'
import VTreeViewItem from '@/components/base/VTreeViewItem.vue'
import { Catalog } from '@/model/evitadb'
import { Toaster, useToaster } from '@/services/editor/toaster'
import LabExplorerConnectionRemoveDialog from './LabExplorerConnectionRemoveDialog.vue'
import { GraphQLConsoleRequest } from '@/model/editor/graphql-console-request'
import { GraphQLInstanceType } from '@/model/editor/graphql-console'
import { EditorService, useEditorService } from '@/services/editor/editor.service'

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

async function loadCatalogs(): Promise<void> {
    if (catalogs.value !== undefined) {
        return
    }
    try {
        catalogs.value = await labService.getCatalogs(props.connection)
    } catch (e: any) {
        toaster.error(e)
    }
}

function handleAction(action: string, payload?: any) {
    switch (action) {
        case ActionType.OpenGraphQLSystemAPIConsole:
            editorService.createTabRequest(
                new GraphQLConsoleRequest(
                    props.connection,
                    'system', // todo lho: this is not needed
                    GraphQLInstanceType.SYSTEM
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
        <template v-slot:activator="{ isOpen, props }">
            <VTreeViewItem
                v-bind="props"
                openable
                :is-open="isOpen"
                prepend-icon="mdi-server"
                :actions="actions"
                @click="loadCatalogs"
                @click:action="handleAction"
            >
                {{ connection.name }}
            </VTreeViewItem>
        </template>

        <div
            v-if="catalogs !== undefined"
        >
            <LabExplorerCatalogItem
                v-for="catalog in catalogs"
                :key="catalog.name"
                :catalog="catalog"
            />
        </div>

        <LabExplorerConnectionRemoveDialog
            v-model="removeConnectionDialogOpen"
            :connection="connection"
        />
    </VListGroup>
</template>

<style lang="scss" scoped>

</style>
