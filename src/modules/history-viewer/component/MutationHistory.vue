<script setup lang="ts">

/**
 * Lists traffic recording history
 */

import VMissingDataIndicator from '@/modules/base/component/VMissingDataIndicator.vue'
import { useI18n } from 'vue-i18n'
import { computed, ref, watch } from 'vue'
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
import { MutationHistoryRequest } from '@/modules/history-viewer/model/MutationHistoryRequest.ts'
import type { ChangeCatalogCapture } from '@/modules/database-driver/request-response/cdc/ChangeCatalogCapture.ts'
import MutationHistoryItem from '@/modules/history-viewer/component/MutationHistoryItem.vue'

// note: this is enum from vuetify, but vuetify doesn't export it
type InfiniteScrollStatus = 'ok' | 'empty' | 'loading' | 'error';

enum MutationHistoryFetchErrorType {

}

class StartRecordsPointer {
    readonly sinceSessionSequenceId: number
    readonly sinceRecordSessionOffset: number

    constructor(sinceSessionSequenceId: number) {
        this.sinceSessionSequenceId = sinceSessionSequenceId
        this.sinceRecordSessionOffset = 0
    }
}

class RecordsPointer {
    private _sinceSessionSequenceId: number = 1
    private _sinceRecordSessionOffset: number = 0

    get sinceSessionSequenceId(): number {
        return this._sinceSessionSequenceId
    }

    get sinceRecordSessionOffset(): number {
        return this._sinceRecordSessionOffset
    }

    reset(startPointer?: StartRecordsPointer): void {
        this._sinceSessionSequenceId = startPointer?.sinceSessionSequenceId || 1
        this._sinceRecordSessionOffset = startPointer?.sinceRecordSessionOffset || 0
    }

    move(sinceSessionSequenceId: number, sinceRecordSessionOffset: number) {
        this._sinceSessionSequenceId = sinceSessionSequenceId
        this._sinceRecordSessionOffset = sinceRecordSessionOffset
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

const startPointer = ref<StartRecordsPointer | undefined>(undefined)
watch(startPointer, () => reloadHistory(), { deep: true })
const nextPagePointer = ref<RecordsPointer>(new RecordsPointer())
const limit = ref<number>(pageSize)

const fetchingNewRecordsWhenThereArentAny = ref<boolean>(false)


const nextPageRequest = computed<MutationHistoryRequest>(() => {
    return new MutationHistoryRequest(props.criteria.entityPrimaryKey, undefined)
})
const lastRecordRequest = computed<MutationHistoryRequest>(() => {
    return new MutationHistoryRequest(props.criteria.entityPrimaryKey, undefined)
})

async function loadNextHistory({ done }: { done: (status: InfiniteScrollStatus) => void }): Promise<void> {
    try {
        const fetchedRecords: ImmutableList<ChangeCatalogCapture> = await fetchRecords()
        fetchError.value = undefined

        if (fetchedRecords.size === 0) {
            await toaster.info(t('trafficViewer.recordHistory.list.notification.noNewerRecords'))
            done('ok')
            return
        }

        moveNextPagePointer(fetchedRecords)
        pushNewRecords(fetchedRecords)
        await processRecords()
        done('ok')
    } catch (e: any) {
        handleRecordFetchError(e)
        done('error')
    }
}

async function reloadHistory(): Promise<void> {
    nextPagePointer.value.reset(startPointer.value)
    records = []
    history.value = []
    fetchError.value = undefined

    try {
        const fetchedRecords: ImmutableList<ChangeCatalogCapture> = await fetchRecords()
        if (fetchedRecords.size === 0) {
            return
        }

        moveNextPagePointer(fetchedRecords)
        pushNewRecords(fetchedRecords)
        await processRecords()
    } catch (e: any) {
        handleRecordFetchError(e)
    }
}

async function tryReloadHistoryForPossibleNewRecords(): Promise<void> {
    fetchingNewRecordsWhenThereArentAny.value = true
    await reloadHistory()
    fetchingNewRecordsWhenThereArentAny.value = false
    if (history.value.length === 0) {
        await toaster.info(t('trafficViewer.recordHistory.list.notification.noNewerRecords'))
        return
    }
}

async function fetchRecords(): Promise<ImmutableList<ChangeCatalogCapture>> {
    return await mutationHistoryViewerService.getMutationHistoryList(
        props.dataPointer.catalogName,
        nextPageRequest.value,
        limit.value
    )
}

function moveNextPagePointer(fetchedRecords: ImmutableList<ChangeCatalogCapture>): void {
    const lastFetchedRecord: ChangeCatalogCapture = fetchedRecords.last()!
    // if (lastFetchedRecord.recordSessionOffset < (lastFetchedRecord.sessionRecordsCount - 1)) {
    //     nextPagePointer.value.move(lastFetchedRecord.sessionSequenceOrder, lastFetchedRecord.recordSessionOffset + 1)
    // } else {
    //     nextPagePointer.value.move(lastFetchedRecord.sessionSequenceOrder + 1n, 0)
    // }
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
    } catch (e: any) {
        console.error(e)
    }
}

function handleRecordFetchError(e: any): void {
    if (e instanceof ConnectError && e.code === Code.InvalidArgument) {
// todp pfi: do I need to fix this?
    }
    toaster.error(t(
        'mutationHistoryViewer.notification.couldNotLoadRecords',
        { reason: e.message }
    )).then()
}

async function moveStartPointerToNewest(): Promise<void> {
    try {
        const latestRecords: ImmutableList<ChangeCatalogCapture> = await mutationHistoryViewerService.getMutationHistoryList(
            props.dataPointer.catalogName,
            lastRecordRequest.value,
            1
        )
        if (latestRecords.size === 0) {
            startPointer.value = undefined
            emit('update:startPointerActive', false)
        } else {
            const latestRecord: ChangeCatalogCapture = latestRecords.get(0)!
            startPointer.value = new StartRecordsPointer(latestRecord.version + 1)
            emit('update:startPointerActive', true)
        }
    } catch (e: any) {
        await toaster.error(t(
            'trafficViewer.recordHistory.notification.couldNotLoadLatestRecording',
            { reason: e.message }
        ))
        emit('update:startPointerActive', false)
    }

}

function removeStartPointer(): void {
    startPointer.value = undefined
    emit('update:startPointerActive', false)
}

tryReloadHistoryForPossibleNewRecords()


defineExpose<{
    reload(): Promise<void>,
    moveStartPointerToNewest(): Promise<void>,
    removeStartPointer(): void
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

            <template #load-more="{ props }">
                <VBtn v-bind="props">
                    {{ t('trafficViewer.recordHistory.list.button.loadMore') }}
                </VBtn>
            </template>
        </VInfiniteScroll>
    </VList>


    <VMissingDataIndicator
        v-else
        icon="mdi-record-circle-outline"
        :title="t('trafficViewer.recordHistory.list.info.noRecords', { catalogName: dataPointer.catalogName })"
    >
        <template #actions>
            <VBtn :loading="fetchingNewRecordsWhenThereArentAny" @click="tryReloadHistoryForPossibleNewRecords">
                {{ t('trafficViewer.recordHistory.button.reloadRecordHistory') }}
            </VBtn>
        </template>
    </VMissingDataIndicator>
</template>

<style lang="scss" scoped>

</style>
