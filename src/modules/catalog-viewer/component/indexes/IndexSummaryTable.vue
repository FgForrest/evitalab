<script setup lang="ts">
/**
 * Index count of one collection broken down by index type and scope — what turns a historically opaque single
 * number ("412 indexes") into something a developer can act on.
 *
 * Pairs with no index are omitted by the engine rather than reported as zero, so a missing cell is rendered as the
 * em-dash placeholder.
 */

import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { List as ImmutableList } from 'immutable'
import { EntityIndexType } from '@/modules/database-driver/request-response/statistics/EntityIndexType'
import { EntityScope } from '@/modules/database-driver/request-response/schema/EntityScope'
import { IndexTypeCount } from '@/modules/database-driver/request-response/statistics/IndexTypeCount'
import {
    CollectionIndexSummary
} from '@/modules/database-driver/request-response/statistics/CollectionIndexSummary'
import { formatNumber, notApplicable } from '@/modules/catalog-viewer/service/statisticsFormatting'

const { t } = useI18n()

const props = defineProps<{
    summary: CollectionIndexSummary
}>()

/**
 * The index types actually present, in the engine's own declaration order, so the rows do not reshuffle between
 * two collections of the same catalog.
 */
const indexTypeOrder: readonly EntityIndexType[] = [
    EntityIndexType.Global,
    EntityIndexType.ReferencedEntityType,
    EntityIndexType.ReferencedEntity,
    EntityIndexType.ReferencedGroupEntityType,
    EntityIndexType.ReferencedGroupEntity
]

const presentTypes = computed<EntityIndexType[]>(() => {
    const present: Set<EntityIndexType> = new Set(
        props.summary.byTypeAndScope.map((it: IndexTypeCount) => it.indexType)
    )
    return indexTypeOrder.filter(it => present.has(it))
})

function countOf(indexType: EntityIndexType, scope: EntityScope): number | undefined {
    return props.summary.byTypeAndScope
        .find((it: IndexTypeCount) => it.indexType === indexType && it.scope === scope)
        ?.count
}

function rowTotal(indexType: EntityIndexType): number {
    return props.summary.byTypeAndScope
        .filter((it: IndexTypeCount) => it.indexType === indexType)
        .reduce((sum: number, it: IndexTypeCount) => sum + it.count, 0)
}

function scopeTotal(scope: EntityScope): number {
    return props.summary.byTypeAndScope
        .filter((it: IndexTypeCount) => it.scope === scope)
        .reduce((sum: number, it: IndexTypeCount) => sum + it.count, 0)
}

const scopes: ImmutableList<EntityScope> = ImmutableList.of(EntityScope.Live, EntityScope.Archive)
</script>

<template>
    <VTable density="compact">
        <thead>
            <tr>
                <th>{{ t('catalogViewer.indexes.summary.column.indexType') }}</th>
                <th v-for="scope in scopes" :key="scope">{{ t(`common.scope.${scope}`) }}</th>
                <th>{{ t('catalogViewer.indexes.summary.column.total') }}</th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="indexType in presentTypes" :key="indexType">
                <td>
                    <span class="index-summary__type">
                        {{ t(`catalogViewer.indexes.indexType.${indexType}`) }}
                        <VIcon icon="mdi-information-outline" size="x-small" />
                        <VTooltip activator="parent">
                            {{ t(`catalogViewer.indexes.help.${indexType}`) }}
                        </VTooltip>
                    </span>
                </td>
                <td v-for="scope in scopes" :key="scope">
                    {{ countOf(indexType, scope) != undefined ? formatNumber(countOf(indexType, scope)) : notApplicable() }}
                </td>
                <td>{{ formatNumber(rowTotal(indexType)) }}</td>
            </tr>
            <tr>
                <td class="text-medium-emphasis">{{ t('catalogViewer.indexes.summary.column.total') }}</td>
                <td v-for="scope in scopes" :key="scope">{{ formatNumber(scopeTotal(scope)) }}</td>
                <td>{{ formatNumber(summary.totalIndexCount) }}</td>
            </tr>
        </tbody>
    </VTable>
</template>

<style lang="scss" scoped>
.index-summary__type {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
}
</style>
