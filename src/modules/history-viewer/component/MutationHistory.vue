<script setup lang="ts">
import { errorMessage } from '@/utils/error'

/**
 * Lists mutation history
 */

import VMissingDataIndicator from '@/modules/base/component/VMissingDataIndicator.vue'
import { useI18n } from 'vue-i18n'
import { computed, ref } from 'vue'
import type { Toaster } from '@/modules/notification/service/Toaster'
import { useToaster } from '@/modules/notification/service/Toaster'
import { List as ImmutableList } from 'immutable'
import VListItemDivider from '@/modules/base/component/VListItemDivider.vue'
import { Code, ConnectError } from '@connectrpc/connect'
import type { MutationHistoryCriteria } from '@/modules/history-viewer/model/MutationHistoryCriteria.ts'
import type { MutationHistoryDataPointer } from '@/modules/history-viewer/model/MutationHistoryDataPointer.ts'
import {
    MutationHistoryViewerService,
    useMutationHistoryViewerService
} from '@/modules/history-viewer/service/MutationHistoryViewerService.ts'
import type {
    MutationHistoryItemVisualisationDefinition
} from '@/modules/history-viewer/model/MutationHistoryItemVisualisationDefinition.ts'
import {
    MutationHistoryRequest,
    reverseScanStartIndex
} from '@/modules/history-viewer/model/MutationHistoryRequest.ts'
import type { ChangeCatalogCapture } from '@/modules/database-driver/request-response/cdc/ChangeCatalogCapture.ts'
import type { MutationHistoryPage } from '@/modules/database-driver/request-response/cdc/MutationHistoryPage.ts'
import {
    hasMoreRecords,
    MutationHistoryStartPointer,
    selectNewestVersion
} from '@/modules/history-viewer/model/MutationHistoryStartPointer.ts'
import MutationHistoryItem from '@/modules/history-viewer/component/MutationHistoryItem.vue'

// note: this is enum from vuetify, but vuetify doesn't export it
type InfiniteScrollStatus = 'ok' | 'empty' | 'loading' | 'error';

enum MutationHistoryFetchErrorType {

}

/**
 * Reverse-pagination state of the list. `sinceVersion`/`sinceIndex` anchor the scan at the newest
 * version of the first page so that concurrent writes cannot shift the following pages.
 */
class RecordsPointer {
    private _sinceVersion: number | undefined = undefined
    private _sinceIndex: number | undefined = undefined
    private _page: number = 1
    private _hasPointer: boolean = false
    private _lastFetchedCount: number | undefined = undefined

    get sinceVersion(): number | undefined {
        return this._sinceVersion
    }

    get sinceIndex(): number | undefined {
        return this._sinceIndex
    }

    get hasPointer(): boolean {
        return this._hasPointer
    }

    reset(): void {
        this._sinceVersion = undefined
        this._sinceIndex = undefined
        this._page = 1
        this._hasPointer = false
    }

    move(sinceVersion: number, sinceIndex: number) {
        this._sinceVersion = sinceVersion
        this._sinceIndex = sinceIndex
        this._hasPointer = true
    }

    get page(): number {
        return this._page
    }

    nextPage(): void {
        this._page = this._page + 1
        this._hasPointer = true
    }

    setPage(page: number): void {
        this._page = page
        this._hasPointer = true
    }

    setLastFetchedCount(count: number): void {
        this._lastFetchedCount = count
    }

    get lastFetchedCount(): number | undefined {
        return this._lastFetchedCount
    }
}

const pageSize: number = 20

const mutationHistoryViewerService: MutationHistoryViewerService = useMutationHistoryViewerService()
const toaster: Toaster = useToaster()
const { t } = useI18n()

const props = defineProps<{
    dataPointer: MutationHistoryDataPointer,
    criteria: MutationHistoryCriteria,
}>()
const emit = defineEmits<{
    (e: 'update:startPointerActive', value: boolean): void
}>()

const fetchError = ref<MutationHistoryFetchErrorType | undefined>(undefined)
let records: ChangeCatalogCapture[] = []
const history = ref<MutationHistoryItemVisualisationDefinition[]>([])

// deliberately no watcher: both actions changing it await the reload themselves, otherwise the parent's
// loading indicator stops before the data arrives
const startPointer = ref<MutationHistoryStartPointer | undefined>(undefined)
const nextPagePointer = ref<RecordsPointer>(new RecordsPointer())
const limit = ref<number>(pageSize)

const fetchingNewRecordsWhenThereArentAny = ref<boolean>(false)


const nextPageRequest = computed<MutationHistoryRequest>(() => {
    const infraType = props.criteria.areaType === 'dataSite' ? 'DATA_SITE'
        : props.criteria.areaType === 'schemaSite' ? 'SCHEMA_SITE'
        : undefined
    // transaction overviews belong to the full-history view only; the entity-grid-scoped viewer renders
    // a narrow list without them. unifying the two is a separate UX decision.
    const loadTransactionOverview: boolean = props.criteria.mutableFilters !== false
    const anchored: boolean = nextPagePointer.value.hasPointer && nextPagePointer.value.sinceVersion != undefined

    return new MutationHistoryRequest({
        from: props.criteria.from,
        to: props.criteria.to,
        operationList: props.criteria.operationList,
        containerNameList: props.criteria.containerNameList,
        containerTypeList: props.criteria.containerTypeList,
        entityPrimaryKey: props.criteria.entityPrimaryKey,
        entityType: props.criteria.entityType,
        infrastructureAreaType: infraType,
        // sinceIndex must accompany sinceVersion, otherwise the server starts the reverse scan at the
        // anchor version's lead event and skips the rest of it
        sinceVersion: anchored ? nextPagePointer.value.sinceVersion : undefined,
        sinceIndex: anchored ? nextPagePointer.value.sinceIndex ?? reverseScanStartIndex : undefined,
        page: nextPagePointer.value.page,
        loadTransaction: loadTransactionOverview,
        newerThanVersion: startPointer.value?.newerThanVersion
    })
})

async function loadNextHistory({ done }: { done: (status: InfiniteScrollStatus) => void }): Promise<void> {
    try {
        // advance page for subsequent loads before fetching
        if (nextPagePointer.value.hasPointer) {
            nextPagePointer.value.nextPage()
        }
        const fetchedPage: MutationHistoryPage = await fetchRecords()
        fetchError.value = undefined

        nextPagePointer.value.setLastFetchedCount(fetchedPage.captureCount)
        if (fetchedPage.records.size === 0) {
            await toaster.info(t('mutationHistoryViewer.list.notification.noOlderRecords'))
            done('ok')
            return
        }

        moveNextPagePointer(fetchedPage)
        pushNewRecords(fetchedPage.records)
        await processRecords()
        done('ok')
    } catch (e) {
        handleRecordFetchError(e)
        done('error')
    }
}

async function reloadHistory(): Promise<void> {
    nextPagePointer.value.reset()
    records = []
    history.value = []
    fetchError.value = undefined

    try {
        const fetchedPage: MutationHistoryPage = await fetchRecords()
        nextPagePointer.value.setLastFetchedCount(fetchedPage.captureCount)
        if (fetchedPage.records.size === 0) {
            if (startPointer.value != undefined) {
                // without this the pointer flow is mute — the list just empties
                await toaster.info(t('mutationHistoryViewer.list.notification.noNewerRecords'))
            }
            return
        }

        moveNextPagePointer(fetchedPage)
        pushNewRecords(fetchedPage.records)
        await processRecords()
    } catch (e) {
        handleRecordFetchError(e)
    }
}

async function tryReloadHistoryForPossibleNewRecords(): Promise<void> {
    fetchingNewRecordsWhenThereArentAny.value = true
    await reloadHistory()
    fetchingNewRecordsWhenThereArentAny.value = false
    if (history.value.length === 0 && startPointer.value == undefined) {
        await toaster.info(t('mutationHistoryViewer.list.notification.noNewerRecords'))
        nextPagePointer.value.setLastFetchedCount(0)
    }
}

async function fetchRecords(): Promise<MutationHistoryPage> {
    return await mutationHistoryViewerService.getMutationHistoryList(
        props.dataPointer.catalogName,
        nextPageRequest.value,
        limit.value
    )
}

function moveNextPagePointer(fetchedPage: MutationHistoryPage): void {
    if (fetchedPage.records.size === 0) return

    // anchor the reverse scan at the newest version of the first page, so that records committed while
    // the user pages through the history cannot shift the following pages
    if (!nextPagePointer.value.hasPointer) {
        const newestVersion: number | undefined = selectNewestVersion(fetchedPage.records.toArray())
        if (newestVersion == undefined) {
            return
        }
        nextPagePointer.value.move(newestVersion, reverseScanStartIndex)
        nextPagePointer.value.setPage(1)
    }

    // For subsequent loads, page is advanced before fetch in loadNextHistory
}

function pushNewRecords(newRecords: ImmutableList<ChangeCatalogCapture>): void {
    for (const newRecord of newRecords) {
        records.push(newRecord)
    }
}

async function processRecords(): Promise<void> {
    // note: we compute the history manually here because for some reason, computed ref wasn't working
    try {
        history.value = (await mutationHistoryViewerService.processRecords(props.dataPointer.catalogName, props.criteria, records)).toArray()
    } catch (e) {
        console.error(e)
    }
}

function handleRecordFetchError(e: unknown): void {
    if (e instanceof ConnectError && e.code === Code.InvalidArgument) {
// todp pfi: do I need to fix this?
    }
    toaster.error(t(
        'mutationHistoryViewer.notification.couldNotLoadRecords',
        { reason: errorMessage(e) }
    )).then()
}

/**
 * Limits the list to records newer than the newest one already loaded. The boundary comes from the
 * records the user is looking at, not from the server's current version — anything committed since the
 * last load counts as new — so no extra request is needed to establish it.
 *
 * With nothing loaded there is no boundary to capture. That is also the state right after a pointer was
 * set and found no newer records, and the action stays offered there, so the pointer is dropped and the
 * full history is loaded back instead of leaving the user on an empty list.
 */
async function moveStartPointerToNewest(): Promise<void> {
    const newestVersion: number | undefined = selectNewestVersion(records)
    startPointer.value = newestVersion != undefined
        ? new MutationHistoryStartPointer(newestVersion)
        : undefined
    emit('update:startPointerActive', startPointer.value != undefined)
    await reloadHistory()
}

async function removeStartPointer(): Promise<void> {
    startPointer.value = undefined
    emit('update:startPointerActive', false)
    await reloadHistory()
}


defineExpose<{
    reload(): Promise<void>,
    moveStartPointerToNewest(): Promise<void>,
    removeStartPointer(): Promise<void>
}>({
    reload: () => reloadHistory(),
    moveStartPointerToNewest,
    removeStartPointer,
})
</script>

<template>
    <VList v-if="fetchError == undefined && history.length > 0">
        <VInfiniteScroll
            mode="manual"
            side="end"
            @load="loadNextHistory"
        >
            <template
                v-for="(visualisationDefinition, index) in history"
                :key="index"
            >
                <MutationHistoryItem :visualisation-definition="visualisationDefinition as MutationHistoryItemVisualisationDefinition" />
                <VListItemDivider v-if="index < history.length - 1"/>
            </template>

            <template #load-more="{ props }" >
                <VBtn v-bind="props" v-if="hasMoreRecords(nextPagePointer.lastFetchedCount, limit)" >
                    {{ t('mutationHistoryViewer.list.button.loadMore') }}
                </VBtn>
            </template>
        </VInfiniteScroll>
    </VList>


    <VMissingDataIndicator
        v-else
        icon="mdi-record-circle-outline"
        :title="t('mutationHistoryViewer.list.info.noRecords', { catalogName: dataPointer.catalogName })"
    >
        <template #actions>
            <VBtn :loading="fetchingNewRecordsWhenThereArentAny" @click="tryReloadHistoryForPossibleNewRecords">
                {{ t('mutationHistoryViewer.list.button.reloadRecordHistory') }}
            </VBtn>
        </template>
    </VMissingDataIndicator>
</template>

<style lang="scss" scoped>

</style>
