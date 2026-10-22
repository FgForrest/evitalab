<script setup lang="ts">
/**
 * One row of the symbol search results: type icon, muted path of the enclosing schemas, the symbol name with the
 * matched characters highlighted, and the action buttons of the symbol. The path is not interactive.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { SymbolSearchResult } from '@/modules/symbol-search/model/SymbolSearchResult'
import type { SymbolAction } from '@/modules/symbol-search/model/SymbolAction'
import { SymbolType } from '@/modules/symbol-search/model/SymbolType'
import { SymbolActionType } from '@/modules/symbol-search/model/SymbolActionType'
import type { MatchRange } from '@/modules/symbol-search/model/MatchRange'
import { CatalogViewerTabDefinition } from '@/modules/catalog-viewer/model/CatalogViewerTabDefinition'
import { SchemaViewerTabDefinition } from '@/modules/schema-viewer/viewer/workspace/model/SchemaViewerTabDefinition'
import {
    EvitaQLConsoleTabDefinition
} from '@/modules/evitaql-console/console/workspace/model/EvitaQLConsoleTabDefinition'
import {
    GraphQLConsoleTabDefinition
} from '@/modules/graphql-console/console/workspace/model/GraphQLConsoleTabDefinition'
import { EntityViewerTabDefinition } from '@/modules/entity-viewer/viewer/workspace/model/EntityViewerTabDefinition'

/**
 * Part of the symbol name, either matched by the query or not.
 */
interface NamePart {
    readonly text: string
    readonly matched: boolean
}

const { t } = useI18n()

const props = defineProps<{
    result: SymbolSearchResult
    actions: SymbolAction[]
    /** whether the row is the selected one (list zone) */
    selected: boolean
    /** index of the selected action of the selected row */
    selectedAction?: number
}>()
const emit = defineEmits<{
    (e: 'execute', actionIndex: number): void
    (e: 'hoverAction', actionIndex: number): void
}>()

const typeIcon = computed<string>(() => {
    switch (props.result.symbol.type) {
        case SymbolType.Catalog:
            return props.result.symbol.catalogStatus?.readOnly === true
                ? 'mdi-database-eye-outline'
                : 'mdi-database-outline'
        case SymbolType.EntityCollection:
            return 'mdi-list-box-outline'
        default:
            return 'mdi-format-list-bulleted-type'
    }
})

const nameParts = computed<NamePart[]>(() => {
    const name: string = props.result.symbol.name
    const parts: NamePart[] = []
    let offset: number = 0
    props.result.displayRanges.forEach(([start, end]: MatchRange) => {
        if (start > offset) {
            parts.push({ text: name.substring(offset, start), matched: false })
        }
        parts.push({ text: name.substring(start, end), matched: true })
        offset = end
    })
    if (offset < name.length) {
        parts.push({ text: name.substring(offset), matched: false })
    }
    return parts
})

function actionIcon(action: SymbolActionType): string {
    switch (action) {
        case SymbolActionType.CatalogPreview:
            return CatalogViewerTabDefinition.icon()
        case SymbolActionType.Schema:
            return SchemaViewerTabDefinition.icon()
        case SymbolActionType.EvitaQLConsole:
            return EvitaQLConsoleTabDefinition.icon()
        case SymbolActionType.GraphQLDataConsole:
        case SymbolActionType.GraphQLSchemaConsole:
            return GraphQLConsoleTabDefinition.icon()
        case SymbolActionType.EntityViewer:
            return EntityViewerTabDefinition.icon()
        default:
            return 'mdi-open-in-new'
    }
}

function actionTooltip(action: SymbolAction): string {
    const label: string = t(`symbolSearch.action.${action.type}`)
    if (action.disabledReason == undefined) {
        return label
    }
    return `${label} · ${t(`symbolSearch.disabledReason.${action.disabledReason}`)}`
}
</script>

<template>
    <!-- not focusable: DOM focus stays in the search field, the selection is driven by the dialog -->
    <VListItem
        :active="selected"
        tabindex="-1"
    >
        <template #prepend>
            <VIcon :icon="typeIcon" />
            <VTooltip activator="parent">{{ t(`symbolSearch.symbolType.${result.symbol.type}`) }}</VTooltip>
        </template>

        <template #title>
            <template v-for="(segment, index) in result.symbol.displayPath" :key="index">
                <span class="text-disabled">{{ segment }}</span>
                <VIcon icon="mdi-chevron-right" size="x-small" class="text-disabled" />
            </template>
            <template v-for="(part, index) in nameParts" :key="`name-${index}`">
                <mark v-if="part.matched" class="symbol-search-result__match">{{ part.text }}</mark>
                <template v-else>{{ part.text }}</template>
            </template>
        </template>

        <template #append>
            <!-- the wrapper carries the tooltip, a disabled button does not receive pointer events -->
            <span v-for="(action, index) in actions" :key="action.type">
                <VBtn
                    icon
                    density="comfortable"
                    size="small"
                    tabindex="-1"
                    :variant="selected && index === selectedAction ? 'tonal' : 'text'"
                    :color="selected && index === selectedAction ? 'primary-lightest' : undefined"
                    :disabled="!action.enabled"
                    :aria-label="t(`symbolSearch.action.${action.type}`)"
                    @mouseenter="emit('hoverAction', index)"
                    @click.stop="emit('execute', index)"
                >
                    <VIcon :icon="actionIcon(action.type)" />
                </VBtn>
                <VTooltip activator="parent">{{ actionTooltip(action) }}</VTooltip>
            </span>
        </template>
    </VListItem>
</template>

<style lang="scss" scoped>
@use "@/styles/colors.scss" as *;

// a plain <mark> carries the browser's yellow background, the lab highlights matches by the accent colour only
.symbol-search-result__match {
    background: none;
    color: $primary-lightest;
    font-weight: 500;
}
</style>
