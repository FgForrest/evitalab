<script setup lang="ts">
import { inject, provide, Ref, ref } from 'vue'
import { LabService, useLabService } from '@/services/lab.service'
import { EvitaDBConnection } from '@/model/lab'
import VTreeViewItem from '@/components/base/VTreeViewItem.vue'
import LabExplorerCollectionItem from './LabExplorerCollectionItem.vue'
import { GraphQLConsoleRequest } from '@/model/editor/graphql-console-request'
import { GraphQLInstanceType } from '@/model/editor/graphql-console'
import { EditorService, useEditorService } from '@/services/editor/editor.service'
import { EvitaQLConsoleRequest } from '@/model/editor/evitaql-console-request'
import { SchemaViewerRequest } from '@/model/editor/schema-viewer-request'
import { CatalogSchemaPointer } from '@/model/editor/schema-viewer'
import { Catalog, CatalogSchema } from '@/model/evitadb'
import { Toaster, useToaster } from '@/services/editor/toaster'
import VTreeViewItemEmpty from '@/components/base/VTreeViewItemEmpty.vue'

enum ActionType {
    OpenEvitaQLConsole = 'open-evitaql-console',
    OpenGraphQLDataAPIConsole = 'open-graphql-data-api-console',
    OpenGraphQLSchemaAPIConsole = 'open-graphql-schema-api-console',
    ViewSchema = 'view-schema'
}

const actions = ref<object[]>([
    {
        value: ActionType.OpenEvitaQLConsole,
        title: 'Open EvitaQL console',
        props: {
            prependIcon: 'mdi-console'
        }
    },
    {
        value: ActionType.OpenGraphQLDataAPIConsole,
        title: 'Open GraphQL Data API console',
        props: {
            prependIcon: 'mdi-graphql'
        }
    },
    {
        value: ActionType.OpenGraphQLSchemaAPIConsole,
        title: 'Open GraphQL Schema API console',
        props: {
            prependIcon: 'mdi-graphql'
        }
    },
    {
        value: ActionType.ViewSchema,
        title: 'View schema',
        props: {
            prependIcon: 'mdi-file-code'
        }
    }
])

const labService: LabService = useLabService()
const editorService: EditorService = useEditorService()
const toaster: Toaster = useToaster()

const props = defineProps<{
    catalog: Catalog
}>()

const connection = inject('connection') as EvitaDBConnection

const catalogSchema = ref<CatalogSchema>()
provide<Ref<CatalogSchema | undefined>>('catalogSchema', catalogSchema)
const loading = ref<boolean>(false)

async function loadCatalogSchema(): Promise<void> {
    if (catalogSchema.value !== undefined || props.catalog.corrupted) {
        return
    }

    loading.value = true
    try {
        catalogSchema.value = await labService.getCatalogSchema(connection, props.catalog.name)
    } catch (e: any) {
        toaster.error(e)
    }
    loading.value = false
}

function handleAction(action: string) {
    switch (action) {
        case ActionType.OpenEvitaQLConsole:
            editorService.createTabRequest(
                new EvitaQLConsoleRequest(
                    connection,
                    props.catalog.name
                )
            )
            break
        case ActionType.OpenGraphQLDataAPIConsole:
            editorService.createTabRequest(
                new GraphQLConsoleRequest(
                    connection,
                    props.catalog.name,
                    GraphQLInstanceType.DATA
                )
            )
            break
        case ActionType.OpenGraphQLSchemaAPIConsole:
            editorService.createTabRequest(
                new GraphQLConsoleRequest(
                    connection,
                    props.catalog.name,
                    GraphQLInstanceType.SCHEMA
                )
            )
            break
        case ActionType.ViewSchema:
            editorService.createTabRequest(
                new SchemaViewerRequest(
                    connection,
                    new CatalogSchemaPointer(props.catalog.name)
                )
            )
            break
    }
}
</script>

<template>
    <VListGroup
        :value="`${connection.name}|${catalog.name}`"
    >
        <template v-slot:activator="{ isOpen, props }">
            <VTreeViewItem
                v-if="!catalog.corrupted"
                v-bind="props"
                openable
                :is-open="isOpen"
                prepend-icon="mdi-menu"
                :loading="loading"
                :actions="actions"
                @click="loadCatalogSchema"
                @click:action="handleAction"
                class="font-weight-bold"
            >
                {{ catalog.name }}
                <VTooltip activator="parent">
                    {{ catalog.name }}
                </VTooltip>
            </VTreeViewItem>

            <VTreeViewItem
                v-else
                v-bind="props"
                prepend-icon="mdi-menu"
                class="text-red"
            >
                {{ catalog.name }}
                <VTooltip activator="parent">
                    This catalog couldn't be loaded because it's corrupted.
                </VTooltip>
            </VTreeViewItem>
        </template>

        <div v-if="!catalog.corrupted && catalogSchema !== undefined">
            <template v-if="Object.values(catalogSchema.entitySchemas).length > 0">
                <LabExplorerCollectionItem
                    v-for="entitySchema in Object.values(catalogSchema.entitySchemas)"
                    :key="entitySchema.name"
                    :entity-schema="entitySchema"
                />
            </template>
            <template v-else>
                <VTreeViewItemEmpty />
            </template>
        </div>
    </VListGroup>
</template>

<style scoped>

</style>
