<script setup lang="ts">

import VTreeViewItem from '@/components/base/VTreeViewItem.vue'
import { EvitaDBConnection } from '@/model/lab'
import { inject, Ref, ref } from 'vue'
import { EditorService, useEditorService } from '@/services/editor/editor.service'
import { CatalogSchema, EntitySchema } from '@/model/evitadb'
import { DataGridRequest } from '@/model/editor/tab/dataGrid/data-grid-request'
import { SchemaViewerRequest } from '@/model/editor/tab/schemaViewer/SchemaViewerRequest'
import { EntitySchemaPointer } from '@/model/editor/tab/schemaViewer/EntitySchemaPointer'

enum ActionType {
    ViewEntities = 'view-entities',
    ViewSchema = 'view-schema'
}

const actions = ref<object[]>([
    {
        value: ActionType.ViewEntities,
        title: 'View entities',
        props: {
            prependIcon: 'mdi-table'
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

const editorService: EditorService = useEditorService()

const props = defineProps<{
    entitySchema: EntitySchema
}>()

const connection = inject<EvitaDBConnection>('connection') as EvitaDBConnection
const catalogSchema = inject<Ref<CatalogSchema | undefined>>('catalogSchema') as Ref<CatalogSchema>

function openDataGrid() {
    editorService.createTab(DataGridRequest.createNew(
        connection as EvitaDBConnection,
        catalogSchema.value.name,
        props.entitySchema.name,
        undefined,
        true // we want to display data to user right away, there is no malicious code here
    ))
}

function handleAction(action: string) {
    switch (action) {
        case ActionType.ViewEntities:
            openDataGrid()
            break
        case ActionType.ViewSchema:
            editorService.createTab(
                SchemaViewerRequest.createNew(
                    connection,
                    new EntitySchemaPointer(
                        catalogSchema.value.name,
                        props.entitySchema.name
                    )
                )
            )
            break
    }
}
</script>

<template>
    <VTreeViewItem
        prepend-icon="mdi-list-box-outline"
        :actions="actions"
        @click="openDataGrid"
        @click:action="handleAction"
        class="text-gray-light text-sm-body-2"
    >
        {{ entitySchema.name }}
        <VTooltip activator="parent">
            {{ entitySchema.name }}
        </VTooltip>
    </VTreeViewItem>
</template>

<style lang="scss" scoped>

</style>
