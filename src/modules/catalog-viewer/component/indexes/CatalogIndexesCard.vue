<script setup lang="ts">
/**
 * The catalog's own indexes: the global unique attribute indexes, one per scope.
 *
 * A catalog index reports **no index type and no entity count** — a globally-unique index maps values to records of
 * *any* collection, so counting entities would count one entity three times if it carried three such attributes.
 * Both are rendered as an explicit em-dash, never as `0`.
 */

import { useI18n } from 'vue-i18n'
import { List as ImmutableList } from 'immutable'
import { useWorkspaceService, WorkspaceService } from '@/modules/workspace/service/WorkspaceService'
import {
    SchemaViewerTabFactory,
    useSchemaViewerTabFactory
} from '@/modules/schema-viewer/viewer/workspace/service/SchemaViewerTabFactory'
import { CatalogAttributeSchemaPointer } from '@/modules/schema-viewer/viewer/model/CatalogAttributeSchemaPointer'
import {
    GlobalUniqueIndexCardinality
} from '@/modules/database-driver/request-response/statistics/GlobalUniqueIndexCardinality'
import { formatNumber, notApplicable } from '@/modules/catalog-viewer/service/statisticsFormatting'

const workspaceService: WorkspaceService = useWorkspaceService()
const schemaViewerTabFactory: SchemaViewerTabFactory = useSchemaViewerTabFactory()
const { t } = useI18n()

const props = defineProps<{
    catalogName: string
    indexes: ImmutableList<GlobalUniqueIndexCardinality>
}>()

function openSchema(index: GlobalUniqueIndexCardinality): void {
    workspaceService.createTab(
        schemaViewerTabFactory.createNew(
            new CatalogAttributeSchemaPointer(props.catalogName, index.attributeName)
        )
    )
}
</script>

<template>
    <div class="catalog-indexes">
        <VTable density="compact">
            <thead>
                <tr>
                    <th>{{ t('catalogViewer.indexes.catalogIndexes.column.attribute') }}</th>
                    <th>{{ t('catalogViewer.indexes.catalogIndexes.column.locale') }}</th>
                    <th>{{ t('catalogViewer.indexes.catalogIndexes.column.scope') }}</th>
                    <th>{{ t('catalogViewer.indexes.catalogIndexes.column.indexType') }}</th>
                    <th>{{ t('catalogViewer.indexes.catalogIndexes.column.entitiesCovered') }}</th>
                    <th>{{ t('catalogViewer.indexes.catalogIndexes.column.distinctValues') }}</th>
                    <th />
                </tr>
            </thead>
            <tbody>
                <tr v-for="(index, position) in indexes" :key="position">
                    <td>{{ index.attributeName }}</td>
                    <td>
                        <span v-if="index.locale != undefined">{{ index.locale.languageTag }}</span>
                        <span v-else class="text-disabled">{{ notApplicable() }}</span>
                    </td>
                    <td>{{ t(`common.scope.${index.scope}`) }}</td>
                    <td class="text-disabled">{{ notApplicable() }}</td>
                    <td class="text-disabled">{{ notApplicable() }}</td>
                    <td>{{ formatNumber(index.distinctValueCount) }}</td>
                    <td>
                        <VBtn icon variant="text" size="x-small" @click="openSchema(index)">
                            <VIcon size="small">mdi-open-in-new</VIcon>
                            <VTooltip activator="parent">
                                {{ t('catalogViewer.indexes.cardinality.button.openSchema') }}
                            </VTooltip>
                        </VBtn>
                    </td>
                </tr>
                <tr v-if="indexes.isEmpty()">
                    <td colspan="7" class="text-disabled font-italic">
                        {{ t('catalogViewer.indexes.catalogIndexes.placeholder.none') }}
                    </td>
                </tr>
            </tbody>
        </VTable>

        <p class="catalog-indexes__footnote text-disabled">
            <VIcon icon="mdi-information-outline" size="x-small" />
            {{ t('catalogViewer.indexes.catalogIndexes.footnote') }}
        </p>
    </div>
</template>

<style lang="scss" scoped>
.catalog-indexes__footnote {
    font-size: 0.75rem;
    margin-top: 0.5rem;
}
</style>
