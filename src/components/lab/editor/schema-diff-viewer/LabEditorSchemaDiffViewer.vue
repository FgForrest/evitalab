<script setup lang="ts">
/**
 * Tab to compare different types of catalog schemas and show the differences (currently GraphQL and OpenAPI schemas
 * generated from the catalog).
 */

import VTabToolbar from '@/components/base/VTabToolbar.vue'
import { computed, ref } from 'vue'
import VPrimaryActionButton from '@/components/base/VPrimaryActionButton.vue'
import { TabComponentEvents, TabComponentProps } from '@/model/editor/editor'
import { SchemaDiffViewerParams } from '@/model/editor/tab/schema-diff-viewer/schema-diff-viewer-params'
import { SchemaDiffViewerData } from '@/model/editor/tab/schema-diff-viewer/schema-diff-viewer-data'
import { LabService, useLabService } from '@/services/lab.service'
import { EvitaDBConnection } from '@/model/lab'
import { Catalog } from '@/model/evitadb'
import { SchemaType } from '@/model/editor/tab/schema-diff-viewer/schema-type'
import LabEditorSchemaDiffViewerGraphQLDiff
    from '@/components/lab/editor/schema-diff-viewer/LabEditorSchemaDiffViewerGraphQLDiff.vue'
import {
    SchemaDiffViewerService,
    useSchemaDiffViewerService
} from '@/services/editor/tab/schema-diff-viewer/schema-diff-viewer.service'

type ConnectionWithCatalogs = {
    connection: EvitaDBConnection
    catalogs: Catalog[] | false
}

type ConnectionWithCatalog = {
    connection: EvitaDBConnection
    catalogName?: string
}

const labService: LabService = useLabService()
const schemaDiffViewerService: SchemaDiffViewerService = useSchemaDiffViewerService()

const props = defineProps<TabComponentProps<SchemaDiffViewerParams, SchemaDiffViewerData>>()
const emit = defineEmits<TabComponentEvents>()

const title = computed<string[]>(() => {
    return [props.params.dataPointer.catalogName, 'Compare schema']
})

const selectedCatalog = ref<any>()
const selectableCatalogs = ref<any[]>()

const selectedSchemaType = ref<any>()
const selectableSchemaTypes = computed<any[]>(() => {
    const selectableSchemaTypes: any[] = []

    if (selectedCatalog.value != undefined) {
        // todo rewrite checks to lab API of checking enabled APIs later
        selectableSchemaTypes.push({
            value: SchemaType.GraphQLDataApi,
            title: 'GraphQL Data API',
            props: {
                prependIcon: 'mdi-graphql',
                disabled: selectedCatalog.value?.value.connection.gqlUrl == undefined
            }
        })
        selectableSchemaTypes.push({
            value: SchemaType.GraphQLSchemaApi,
            title: 'GraphQL Schema API',
            props: {
                prependIcon: 'mdi-graphql',
                disabled: selectedCatalog.value?.value.connection.gqlUrl == undefined
            }
        })
        selectableSchemaTypes.push({
            value: SchemaType.OpenApi,
            title: 'OpenAPI',
            props: {
                prependIcon: 'mdi-api',
                disabled: selectedCatalog.value?.value.connection.restUrl == undefined
            }
        })
    }

    return selectableSchemaTypes
})

const connections: EvitaDBConnection[] = labService.getConnections()
const connectionsWithCatalogs: Promise<ConnectionWithCatalogs>[] = []
for (const connection of connections) {
    connectionsWithCatalogs.push(labService.getCatalogs(connection)
        .then((catalogs: Catalog[]) => {
            return {
                connection,
                catalogs: catalogs.filter(catalog => connection.id !== props.params.dataPointer.connection.id ||
                    catalog.name !== props.params.dataPointer.catalogName)
            }
        })
        .catch(error => {
            console.info(`Couldn't load catalogs for connection '${connection.name}', skipping...`, error)
            return {
                connection,
                catalogs: false
            }
        })
    )
}
Promise.all(connectionsWithCatalogs).then((connectionsWithCatalogs: ConnectionWithCatalogs[]) => {
    const _selectableCatalogs: any[] = []

    for (const connectionWithCatalog of connectionsWithCatalogs) {
        if (connectionWithCatalog.catalogs instanceof Array && connectionWithCatalog.catalogs.length === 0) {
            continue
        }

        const connection = connectionWithCatalog.connection
        if (connectionWithCatalog.catalogs === false) {
            _selectableCatalogs.push({
                value: {
                    connection
                } as ConnectionWithCatalog,
                title: `${connection.name} (unavailable)`,
                props: {
                    disabled: true
                }
            })
        } else {
            for (const catalog of connectionWithCatalog.catalogs) {
                if (catalog.corrupted) {
                    continue
                }
                _selectableCatalogs.push({
                    value: { connection, catalogName: catalog.name } as ConnectionWithCatalog,
                    title: `${connection.name} / ${catalog.name}`
                })
            }
        }
    }

    selectableCatalogs.value = _selectableCatalogs
    emit('ready')
})


const graphQLDiff = ref<any>()

async function fetchDiff(): Promise<void> {
    graphQLDiff.value = await schemaDiffViewerService.getGraphQLDataApiDiff(
        props.params.dataPointer,
        selectedCatalog.value?.value
    )
}
</script>

<template>
    <div class="schema-diff-viewer">
        <VTabToolbar
            prepend-icon="mdi-compare-horizontal"
            :path="title"
        >
            <template #append>
                <VPrimaryActionButton @click="fetchDiff">
                    <template #prepend-icon>
                        mdi-compare-horizontal
                    </template>

                    <template #default>
                        <!-- todo shortcut -->
                        <VTooltip activator="parent">
                            Compare
                        </VTooltip>
                        Compare
                    </template>
                </VPrimaryActionButton>
            </template>
        </VTabToolbar>

        <VSheet class="schema-diff-viewer__body">
            <div class="differ">
                <header class="differ-input">
                    <VCombobox
                        v-model="selectedSchemaType"
                        :disabled="selectableSchemaTypes == undefined || selectableSchemaTypes.length === 0"
                        prepend-inner-icon="mdi-file-code"
                        label="Schema"
                        :items="selectableSchemaTypes"
                        hide-details
                        class="differ-input__select"
                    />
                    <VBtnGroup>
                        <VBtn icon>
                            <VIcon>mdi-arrow-left</VIcon>
                        </VBtn>
                        <VBtn icon>
                            <VIcon>mdi-arrow-left</VIcon>
                        </VBtn>
                    </VBtnGroup>
                    <VCombobox
                        v-model="selectedCatalog"
                        :disabled="selectableCatalogs == undefined || selectableCatalogs.length === 0"
                        prepend-inner-icon="mdi-menu"
                        label="Compare to"
                        :items="selectableCatalogs"
                        hide-details
                        class="differ-input__select"
                    />
                </header>
                <div class="differ-output">
                    <LabEditorSchemaDiffViewerGraphQLDiff v-if="graphQLDiff" :diff="graphQLDiff" />
<!--                    todo -->
<!--                    <div class="missing-data-indicator text-disabled">-->
<!--                        <slot>-->
<!--                            <VIcon>{{ icon }}</VIcon>-->
<!--                            <span>{{ title }}</span>-->
<!--                        </slot>-->
<!--                    </div>-->
                </div>
            </div>
        </VSheet>
    </div>
</template>

<style lang="scss" scoped>
.schema-diff-viewer {
    display: grid;
    grid-template-rows: 3rem 1fr;

    &__header {
        z-index: 100;
    }

    &__body {
        position: relative;
    }
}

.differ {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    padding: 1rem;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.differ-input {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;

    &__select {
        flex: 1;
        min-width: 15rem;
    }
}

.differ-output {

}
</style>
