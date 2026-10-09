<script setup lang="ts">
/**
 * Pairs what a collection's indexes actually hold with the schema that declared them — the single most useful
 * thing on the page. It turns "we declared 12 filterable attributes" into "3 of them have 2 distinct values
 * across 2 M records".
 *
 * `distinctValues` and `recordsCovered` are both shown even for a unique index, and are not redundant: a
 * globally-unique attribute that is *also* localized has one locale-less key covering every locale, so a single
 * record can own several values. Hiding the second column would hide exactly the case worth seeing.
 *
 * The measured columns sort; the descriptive ones do not. Unsorted, the rows are the engine's response order, which
 * keeps every attribute index of one entity index in one block — the reading the *Index* column is there for.
 */

import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useWorkspaceService, WorkspaceService } from '@/modules/workspace/service/WorkspaceService'
import {
    SchemaViewerTabFactory,
    useSchemaViewerTabFactory
} from '@/modules/schema-viewer/viewer/workspace/service/SchemaViewerTabFactory'
import { EntityAttributeSchemaPointer } from '@/modules/schema-viewer/viewer/model/EntityAttributeSchemaPointer'
import {
    ReferenceAttributeSchemaPointer
} from '@/modules/schema-viewer/viewer/model/ReferenceAttributeSchemaPointer'
import { AttributeCardinality } from '@/modules/database-driver/request-response/statistics/AttributeCardinality'
import { IndexCardinality } from '@/modules/database-driver/request-response/statistics/IndexCardinality'
import {
    CollectionIndexCardinality
} from '@/modules/database-driver/request-response/statistics/CollectionIndexCardinality'
import { formatNumber, formatPercent, notApplicable } from '@/modules/catalog-viewer/service/statisticsFormatting'

const workspaceService: WorkspaceService = useWorkspaceService()
const schemaViewerTabFactory: SchemaViewerTabFactory = useSchemaViewerTabFactory()
const { t } = useI18n()

const props = defineProps<{
    catalogName: string
    entityType: string
    cardinality: CollectionIndexCardinality
}>()

/**
 * One rendered row: one attribute index inside one entity index. The values the table sorts and prints are carried
 * on the row itself, so a sort orders exactly what the reader sees.
 */
interface CardinalityRow {
    readonly attribute: AttributeCardinality
    readonly element: string
    readonly indexLabel: string
    readonly entityCount: number | undefined
    readonly distinctValueCount: number
    readonly recordsCovered: number
    readonly cardinalityRatio: number | undefined
}

const rows = computed<CardinalityRow[]>(() =>
    props.cardinality.indexes
        .flatMap((index: IndexCardinality) =>
            index.attributes.map((attribute: AttributeCardinality) => ({
                attribute,
                element: elementLabel(attribute),
                indexLabel: indexLabel(index),
                entityCount: index.entityCount,
                distinctValueCount: attribute.distinctValueCount,
                recordsCovered: attribute.recordsCovered,
                cardinalityRatio: attribute.cardinalityRatio
            }))
        )
        .toArray()
)

/**
 * Only the measured columns are sortable — the three descriptive ones are what the engine's own grouping is read
 * by (every attribute index of one entity index in one block), and that grouping is worth keeping.
 */
const headers = computed(() => [
    { title: t('catalogViewer.indexes.cardinality.column.element'), key: 'element', sortable: false },
    { title: t('catalogViewer.indexes.cardinality.column.declaredAs'), key: 'declaredAs', sortable: false },
    { title: t('catalogViewer.indexes.cardinality.column.index'), key: 'indexLabel', sortable: false },
    {
        title: t('catalogViewer.indexes.cardinality.column.entityCount'),
        key: 'entityCount',
        align: 'end' as const
    },
    {
        title: t('catalogViewer.indexes.cardinality.column.distinctValues'),
        key: 'distinctValueCount',
        align: 'end' as const
    },
    {
        title: t('catalogViewer.indexes.cardinality.column.recordsCovered'),
        key: 'recordsCovered',
        align: 'end' as const
    },
    {
        title: t('catalogViewer.indexes.cardinality.column.ratio'),
        key: 'cardinalityRatio',
        align: 'end' as const
    },
    { title: '', key: 'actions', sortable: false }
])

function elementLabel(attribute: AttributeCardinality): string {
    const base: string = attribute.referenceName != undefined
        ? `${attribute.referenceName}.${attribute.attributeName}`
        : attribute.attributeName
    return attribute.locale != undefined ? `${base} (${attribute.locale.languageTag})` : base
}

function indexLabel(index: IndexCardinality): string {
    const type: string = index.indexType != undefined
        ? t(`catalogViewer.indexes.indexType.${index.indexType}`)
        : notApplicable()
    const scope: string = t(`common.scope.${index.scope}`)
    return index.discriminator != undefined
        ? `${type} · ${scope} · ${index.discriminator}`
        : `${type} · ${scope}`
}

/**
 * A ratio near 1 is a near-unique index; near 0 is a low-selectivity index that rarely narrows anything and mostly
 * costs memory and write time.
 */
function ratioClass(row: CardinalityRow): string {
    const ratio: number | undefined = row.cardinalityRatio
    if (ratio == undefined) {
        return 'text-disabled'
    }
    if (ratio < 0.01) {
        return 'text-warning'
    }
    if (ratio > 0.9) {
        return 'text-success'
    }
    return ''
}

function openSchema(row: CardinalityRow): void {
    const attribute: AttributeCardinality = row.attribute
    workspaceService.createTab(
        schemaViewerTabFactory.createNew(
            attribute.referenceName != undefined
                ? new ReferenceAttributeSchemaPointer(
                    props.catalogName,
                    props.entityType,
                    attribute.referenceName,
                    attribute.attributeName
                )
                : new EntityAttributeSchemaPointer(
                    props.catalogName,
                    props.entityType,
                    attribute.attributeName
                )
        )
    )
}
</script>

<template>
    <div class="index-cardinality">
        <!--
            Sorting is left to the table's own uncontrolled state, and no default sort is declared: unsorted, the
            rows are the engine's response order, which groups every attribute index of one entity index together.
        -->
        <VDataTable
            :headers="headers"
            :items="rows"
            :items-per-page="-1"
            density="compact"
            hide-default-footer
        >
            <template
                v-for="header in headers"
                :key="header.key"
                v-slot:[`header.${header.key}`]="{ column, isSorted, getSortIcon }"
            >
                <div class="index-cardinality__header">
                    <span>{{ column.title }}</span>
                    <template v-if="column.sortable">
                        <VIcon v-if="isSorted(column)" size="small">{{ getSortIcon(column) }}</VIcon>
                        <VIcon v-else size="small">mdi-sort</VIcon>
                    </template>
                </div>
            </template>

            <template #item="{ item: row }">
                <tr>
                    <td>{{ row.element }}</td>
                    <td>
                        <!--
                            both chips only label the row - the plain variant is what a non-actionable chip carries
                            in this application, and the outline would promise a click that does not exist.
                            They wrap in a flex container, because in a narrow window the two land on separate lines
                            and the compact row height does not leave them any space of their own.
                        -->
                        <div class="index-cardinality__chips">
                            <VChip size="x-small">
                                {{ t(`catalogViewer.indexes.attributeIndexType.${row.attribute.indexType}`) }}
                                <VTooltip activator="parent">
                                    {{ t(`catalogViewer.indexes.help.attributeIndexType.${row.attribute.indexType}`) }}
                                </VTooltip>
                            </VChip>
                            <VChip
                                v-if="row.attribute.locale != undefined"
                                size="x-small"
                                prepend-icon="mdi-translate"
                            >
                                {{ row.attribute.locale.languageTag }}
                                <VTooltip activator="parent">
                                    {{ t('catalogViewer.indexes.help.localizedAttributeIndex') }}
                                </VTooltip>
                            </VChip>
                        </div>
                    </td>
                    <td>{{ row.indexLabel }}</td>
                    <td class="text-right">{{ formatNumber(row.entityCount) }}</td>
                    <td class="text-right">{{ formatNumber(row.distinctValueCount) }}</td>
                    <td class="text-right">{{ formatNumber(row.recordsCovered) }}</td>
                    <td class="text-right" :class="ratioClass(row)">
                        {{ formatPercent(row.cardinalityRatio) }}
                    </td>
                    <td>
                        <VBtn icon variant="text" size="x-small" @click="openSchema(row)">
                            <VIcon size="small">mdi-open-in-new</VIcon>
                            <VTooltip activator="parent">
                                {{ t('catalogViewer.indexes.cardinality.button.openSchema') }}
                            </VTooltip>
                        </VBtn>
                    </td>
                </tr>
            </template>

            <template #no-data>
                <span class="text-disabled font-italic">
                    {{ t('catalogViewer.indexes.cardinality.placeholder.noDescribedIndexes') }}
                </span>
            </template>
        </VDataTable>

        <p v-if="cardinality.omittedIndexCount > 0" class="index-cardinality__note text-disabled">
            <VIcon icon="mdi-information-outline" size="x-small" />
            {{
                t('catalogViewer.indexes.cardinality.omittedNote', {
                    count: formatNumber(cardinality.omittedIndexCount)
                })
            }}
        </p>
    </div>
</template>

<style lang="scss" scoped>
.index-cardinality {
    &__header {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
    }

    // this is the only cell that can grow past one line, and the padding that keeps the second line off the row
    // separators sits on the container rather than on the cell: the table's own `td` rule is more specific than a
    // single class, so a cell-level padding would be silently dropped
    &__chips {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.25rem;
        padding-top: 0.25rem;
        padding-bottom: 0.25rem;
    }

    &__note {
        font-size: 0.75rem;
        margin-top: 0.5rem;
    }
}
</style>
