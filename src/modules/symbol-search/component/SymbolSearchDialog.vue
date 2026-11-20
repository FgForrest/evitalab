<script setup lang="ts">
/**
 * The symbol search popup: a search field, the indexing progress, the ordered results with their actions and a
 * footer with keyboard hints. DOM focus stays in the search field the whole time; which part the navigation keys
 * drive is the logical zone of {@link SymbolSearchSelection}.
 *
 * Built on `VLabDialog` with a fixed body height, so the dialog does not jump while the result count changes.
 */
import { computed, nextTick, reactive, ref, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { SymbolSearchService, useSymbolSearchService } from '@/modules/symbol-search/service/SymbolSearchService'
import { Keymap, useKeymap } from '@/modules/keymap/service/Keymap'
import { Command } from '@/modules/keymap/model/Command'
import { type Toaster, useToaster } from '@/modules/notification/service/Toaster'
import { asError } from '@/utils/error'
import {
    SymbolSearchConfirmation,
    SymbolSearchSelection,
    SymbolSearchZone
} from '@/modules/symbol-search/model/SymbolSearchSelection'
import { SymbolSearchResults } from '@/modules/symbol-search/model/SymbolSearchResults'
import type { SymbolSearchResult } from '@/modules/symbol-search/model/SymbolSearchResult'
import type { SymbolAction } from '@/modules/symbol-search/model/SymbolAction'
import { type SymbolIndexState, SymbolIndexStatus } from '@/modules/symbol-search/model/SymbolIndexState'
import { maxIndexedSymbols } from '@/modules/symbol-search/service/SymbolIndex'
import SymbolSearchResultItem from '@/modules/symbol-search/component/SymbolSearchResultItem.vue'
import VMissingDataIndicator from '@/modules/base/component/VMissingDataIndicator.vue'
import VLabDialog from '@/modules/base/component/VLabDialog.vue'
import VListItemDivider from '@/modules/base/component/VListItemDivider.vue'

/**
 * Selection remembered when an action was executed, restored when the popup is opened again.
 */
interface RememberedSelection {
    readonly symbolId: string
    readonly actionIndex: number
}

/**
 * One line of the keyboard help shown for an empty query.
 */
interface HelpItem {
    readonly keys: string[]
    readonly description: string
}

const searchDebounceMs: number = 50
const pageSize: number = 10

const symbolSearchService: SymbolSearchService = useSymbolSearchService()
const keymap: Keymap = useKeymap()
const toaster: Toaster = useToaster()
const { t } = useI18n()

const opened = symbolSearchService.opened
const indexState = symbolSearchService.state
const indexRevision = symbolSearchService.revision
const enabledApis = symbolSearchService.enabledApis

const shortcut: string = keymap.prettyPrint(Command.System_SymbolSearch)

const searchField = ref<{ focus: () => void, select: () => void } | undefined>()
const resultList = ref<HTMLElement | undefined>()
const query = ref<string>('')
// replaced as a whole on every search, never mutated
const searchResults = shallowRef<SymbolSearchResults>(SymbolSearchResults.empty())
const resultActions = shallowRef<SymbolAction[][]>([])
const selection = reactive(new SymbolSearchSelection())

let searchTimeoutId: ReturnType<typeof setTimeout> | undefined = undefined
let previouslyFocusedElement: HTMLElement | undefined = undefined
let restoreFocusOnClose: boolean = true
// an executed action keeps the query and the selection for the next opening, any other way of closing clears them
let keepQueryOnClose: boolean = false
let rememberedSelection: RememberedSelection | undefined = undefined

const hasQuery = computed<boolean>(() => query.value.trim().length > 0)
const results = computed<SymbolSearchResult[]>(() => searchResults.value.results)

const enterHint = computed<string | undefined>(() => {
    if (!hasQuery.value || results.value.length === 0) {
        return undefined
    }
    if (selection.zone === SymbolSearchZone.Input) {
        return t('symbolSearch.footer.goToResults')
    }
    const actions: SymbolAction[] = resultActions.value[selection.rowIndex] ?? []
    const selectedAction: SymbolAction | undefined = selection.selectedAction != undefined
        ? actions[selection.selectedAction]
        : undefined
    if (selectedAction != undefined) {
        return t(`symbolSearch.enterAction.${selectedAction.type}`)
    }
    const disabledReason = actions[0]?.disabledReason
    return disabledReason != undefined ? t(`symbolSearch.disabledReason.${disabledReason}`) : undefined
})

const helpItems = computed<HelpItem[]>(() => [
    { keys: ['↵'], description: t('symbolSearch.help.execute') },
    { keys: ['↑', '↓'], description: t('symbolSearch.help.moveRows') },
    { keys: ['←', '→'], description: t('symbolSearch.help.switchActions') },
    { keys: ['esc'], description: t('symbolSearch.help.close') }
])

/**
 * The index state while it matters (building, truncated, failed), nothing for a ready or not yet built index.
 */
const indexInfo = computed<string | undefined>(() => {
    const state: SymbolIndexState = indexState.value
    switch (state.status) {
        case SymbolIndexStatus.Building:
            return t('symbolSearch.index.indexing', {
                catalogName: state.currentCatalog ?? '',
                done: state.builtCatalogs,
                total: state.catalogsToBuild
            })
        case SymbolIndexStatus.LimitExceeded:
            return t('symbolSearch.index.truncated', { count: state.truncatedCatalogs, limit: maxIndexedSymbols })
        case SymbolIndexStatus.Failed:
            return t('symbolSearch.index.failed')
        default:
            return undefined
    }
})

const indexingProgress = computed<number>(() => {
    const state: SymbolIndexState = indexState.value
    return state.catalogsToBuild === 0 ? 0 : state.builtCatalogs / state.catalogsToBuild * 100
})

watch(opened, (isOpened: boolean) => {
    if (isOpened) {
        // the shortcuts of the tab behind the popup must not fire while typing into it
        keymap.suspendActivatedContext()
        previouslyFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : undefined
        restoreFocusOnClose = true
        keepQueryOnClose = false
        // the query was cleared (or deliberately kept) when the popup closed, so this is the only search of the opening
        runSearch(true)
        restoreRememberedSelection()
        focusSearchField(true)
    } else {
        keymap.resumeActivatedContext()
    }
})

watch(query, () => scheduleSearch())
// the index grew (a catalog got indexed) or the web API availability got known: refresh, keep the selection
watch([indexRevision, enabledApis], () => runSearch(false))

function scheduleSearch(): void {
    cancelScheduledSearch()
    searchTimeoutId = setTimeout(() => {
        searchTimeoutId = undefined
        runSearch(true)
    }, searchDebounceMs)
}

function cancelScheduledSearch(): void {
    if (searchTimeoutId != undefined) {
        clearTimeout(searchTimeoutId)
        searchTimeoutId = undefined
    }
}

/**
 * Searches the current query.
 *
 * @param resetSelection whether the user changed the query (selection starts over in the input zone) or only the
 *                       index changed underneath (selection is kept where possible)
 */
function runSearch(resetSelection: boolean): void {
    if (!opened.value) {
        return
    }
    const hadResults: boolean = searchResults.value.results.length > 0
    searchResults.value = symbolSearchService.search(query.value)
    resultActions.value = searchResults.value.results.map(result => symbolSearchService.getActions(result.symbol))
    const rows: boolean[][] = resultActions.value.map(actions => actions.map(action => action.enabled))
    // the first result is preselected so Enter runs its action right away; results that only appeared because
    // the index grew underneath count as new ones
    if (resetSelection || !hadResults) {
        selection.reset(rows, true)
        if (resultList.value != undefined) {
            resultList.value.scrollTop = 0
        }
    } else {
        selection.updateRows(rows)
    }
}

/**
 * Runs a search still waiting for its debounce right away, so a fast Enter acts on what was typed.
 */
function flushScheduledSearch(): void {
    if (searchTimeoutId != undefined) {
        cancelScheduledSearch()
        runSearch(true)
    }
}

/**
 * Selects the row and action of the last executed action again, if its symbol is still among the results.
 */
function restoreRememberedSelection(): void {
    const remembered: RememberedSelection | undefined = rememberedSelection
    rememberedSelection = undefined
    if (remembered == undefined) {
        return
    }
    const rowIndex: number = results.value.findIndex(result => result.symbol.id === remembered.symbolId)
    if (selection.restore(rowIndex, remembered.actionIndex)) {
        scrollSelectedRowIntoView()
    }
}

/**
 * @param selectQuery whether a kept query should be selected, so typing replaces it
 */
function focusSearchField(selectQuery: boolean = false): void {
    nextTick(() => {
        searchField.value?.focus()
        if (selectQuery && hasQuery.value) {
            searchField.value?.select()
        }
    })
}

function handleKeydown(event: KeyboardEvent): void {
    let changed: boolean = false
    switch (event.key) {
        case 'ArrowDown':
            event.preventDefault()
            flushScheduledSearch()
            changed = selection.moveDown()
            break
        case 'ArrowUp':
            event.preventDefault()
            changed = selection.moveUp()
            break
        case 'ArrowRight':
            if (selection.zone === SymbolSearchZone.List) {
                event.preventDefault()
                changed = selection.moveRight()
            }
            break
        case 'ArrowLeft':
            if (selection.zone === SymbolSearchZone.List) {
                event.preventDefault()
                changed = selection.moveLeft()
            }
            break
        case 'PageDown':
            event.preventDefault()
            changed = selection.moveBy(pageSize)
            break
        case 'PageUp':
            event.preventDefault()
            changed = selection.moveBy(-pageSize)
            break
        case 'Home':
        case 'End':
            if (event.ctrlKey && selection.zone === SymbolSearchZone.List) {
                event.preventDefault()
                changed = event.key === 'Home' ? selection.moveToFirst() : selection.moveToLast()
            }
            break
        case 'Enter': {
            if (event.isComposing) {
                // confirms an IME composition, not the selection
                return
            }
            event.preventDefault()
            flushScheduledSearch()
            const confirmation: SymbolSearchConfirmation = selection.confirm()
            if (confirmation === SymbolSearchConfirmation.Execute) {
                executeSelected()
            } else {
                changed = confirmation === SymbolSearchConfirmation.EnteredList
            }
            break
        }
    }
    if (changed) {
        scrollSelectedRowIntoView()
    }
}

function scrollSelectedRowIntoView(): void {
    nextTick(() => {
        const row: Element | null | undefined = resultList.value?.querySelector(`[data-row="${selection.rowIndex}"]`)
        row?.scrollIntoView({ block: 'nearest' })
    })
}

function hoverRow(rowIndex: number): void {
    selection.hover(rowIndex)
}

function hoverAction(rowIndex: number, actionIndex: number): void {
    selection.hoverAction(rowIndex, actionIndex)
}

function clickRow(rowIndex: number): void {
    selection.hover(rowIndex)
    executeSelected()
}

function executeSelected(): void {
    const rowIndex: number | undefined = selection.selectedRow
    const actionIndex: number | undefined = selection.selectedAction
    if (rowIndex == undefined || actionIndex == undefined) {
        return
    }
    executeAction(rowIndex, actionIndex)
}

function executeAction(rowIndex: number, actionIndex: number): void {
    const result: SymbolSearchResult | undefined = results.value[rowIndex]
    const action: SymbolAction | undefined = resultActions.value[rowIndex]?.[actionIndex]
    if (result == undefined || action == undefined || !action.enabled) {
        return
    }
    // the opened tab takes over, focus must not jump back to where the popup was opened from
    restoreFocusOnClose = false
    keepQueryOnClose = true
    rememberedSelection = { symbolId: result.symbol.id, actionIndex }
    try {
        symbolSearchService.execute(action.type, result.symbol)
    } catch (e) {
        toaster.error(t('symbolSearch.notification.couldNotOpenSymbol'), asError(e)).then()
    }
}

function retryIndexing(): void {
    symbolSearchService.ensureIndex().then()
    focusSearchField()
}

function handleOpenedChange(value: boolean): void {
    if (!value) {
        symbolSearchService.close()
    }
}

function handleAfterLeave(): void {
    if (!keepQueryOnClose) {
        query.value = ''
    }
    searchResults.value = SymbolSearchResults.empty()
    resultActions.value = []
    cancelScheduledSearch()
    if (restoreFocusOnClose) {
        previouslyFocusedElement?.focus({ preventScroll: true })
    }
    previouslyFocusedElement = undefined
}
</script>

<template>
    <VLabDialog
        :model-value="opened"
        :max-width="720"
        @update:model-value="handleOpenedChange"
        @after-enter="focusSearchField(true)"
        @after-leave="handleAfterLeave"
    >
        <template #title>
            {{ t('symbolSearch.title') }}
        </template>

        <template #default>
            <div class="symbol-search">
                <VTextField
                    ref="searchField"
                    v-model="query"
                    :label="t('symbolSearch.label', { shortcut })"
                    :placeholder="t('symbolSearch.placeholder')"
                    prepend-inner-icon="mdi-magnify"
                    hide-details
                    autocomplete="off"
                    spellcheck="false"
                    @keydown="handleKeydown"
                />

                <VProgressLinear
                    :active="indexState.building"
                    :model-value="indexingProgress"
                    color="primary-lightest"
                    height="2"
                />

                <!-- mousedown is prevented so DOM focus never leaves the search field -->
                <div
                    ref="resultList"
                    class="symbol-search__body"
                    @mousedown.prevent
                >
                    <VList v-if="!hasQuery" density="compact" tabindex="-1">
                        <VListItem class="text-medium-emphasis">
                            <I18nT keypath="symbolSearch.help.intro" tag="span">
                                <template #example>
                                    <VChip density="compact">pv</VChip>
                                </template>
                            </I18nT>
                        </VListItem>
                        <VListItem
                            v-for="help in helpItems"
                            :key="help.description"
                            :title="help.description"
                        >
                            <template #prepend>
                                <div class="symbol-search__help-keys">
                                    <VChip v-for="key in help.keys" :key="key" density="compact">{{ key }}</VChip>
                                </div>
                            </template>
                        </VListItem>
                    </VList>

                    <VMissingDataIndicator
                        v-else-if="results.length === 0"
                        icon="mdi-magnify-close"
                        :title="t('symbolSearch.noMatch', { query })"
                    />

                    <VList v-else lines="one" tabindex="-1">
                        <template v-for="(result, index) in results" :key="result.symbol.id">
                            <VListItemDivider v-if="index > 0" />
                            <SymbolSearchResultItem
                                :data-row="index"
                                :result="result"
                                :actions="resultActions[index] ?? []"
                                :selected="selection.selectedRow === index"
                                :selected-action="selection.selectedAction"
                                @mousemove="hoverRow(index)"
                                @hover-action="hoverAction(index, $event)"
                                @click="clickRow(index)"
                                @execute="executeAction(index, $event)"
                            />
                        </template>
                        <VListItem
                            v-if="searchResults.totalCount > results.length"
                            :subtitle="t('symbolSearch.cap', { shown: results.length, total: searchResults.totalCount })"
                        />
                    </VList>
                </div>

                <div class="symbol-search__footer text-medium-emphasis">
                    <span><VChip density="compact" size="small">↑↓</VChip> {{ t('symbolSearch.footer.symbol') }}</span>
                    <span><VChip density="compact" size="small">←→</VChip> {{ t('symbolSearch.footer.action') }}</span>
                    <span v-if="enterHint != undefined">
                        <VChip density="compact" size="small">↵</VChip> {{ enterHint }}
                    </span>
                    <span><VChip density="compact" size="small">esc</VChip> {{ t('symbolSearch.footer.close') }}</span>
                    <VSpacer />
                    <span
                        v-if="indexInfo != undefined"
                        :class="{ 'text-warning': indexState.status === SymbolIndexStatus.LimitExceeded || indexState.status === SymbolIndexStatus.Failed }"
                    >
                        <VIcon
                            v-if="indexState.status === SymbolIndexStatus.LimitExceeded"
                            icon="mdi-alert-outline"
                            size="small"
                        />
                        {{ indexInfo }}
                        <VBtn
                            v-if="indexState.status === SymbolIndexStatus.Failed"
                            variant="text"
                            density="compact"
                            size="small"
                            @click="retryIndexing"
                        >
                            {{ t('symbolSearch.button.retry') }}
                        </VBtn>
                    </span>
                </div>
            </div>
        </template>
    </VLabDialog>
</template>

<style lang="scss" scoped>
// fixed height, so the dialog does not jump while the number of results changes; only the body scrolls
.symbol-search {
    display: grid;
    grid-template-rows: auto auto minmax(0, 1fr) auto;
    height: min(34rem, 70vh);
}

.symbol-search__body {
    overflow-y: auto;
    min-height: 0;
    display: flex;
    flex-direction: column;
}

.symbol-search__help-keys {
    display: flex;
    gap: 0.25rem;
    min-width: 6rem;
}

.symbol-search__footer {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.25rem 1rem;
    padding-top: 0.5rem;
    border-top: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
    font-size: 0.75rem;
}
</style>
