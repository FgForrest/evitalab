<script setup lang="ts">

/**
 * Lists traffic recording history
 */

import VMissingDataIndicator from '@/modules/base/component/VMissingDataIndicator.vue'
import { useI18n } from 'vue-i18n'
import { computed, ref, watch } from 'vue'
import { Toaster, useToaster } from '@/modules/notification/service/Toaster'
import { TrafficViewerService, useTrafficViewerService } from '@/modules/traffic-viewer/service/TrafficViewerService'
import { TrafficRecordHistoryDataPointer } from '@/modules/traffic-viewer/model/TrafficRecordHistoryDataPointer'
import Immutable from 'immutable'
import { TrafficRecord } from '@/modules/connection/model/traffic/TrafficRecord'
import { TrafficRecordingCaptureRequest } from '@/modules/connection/model/traffic/TrafficRecordingCaptureRequest'
import { TrafficRecordContent } from '@/modules/connection/model/traffic/TrafficRecordContent'
import VListItemDivider from '@/modules/base/component/VListItemDivider.vue'
import { TrafficRecordHistoryCriteria } from '@/modules/traffic-viewer/model/TrafficRecordHistoryCriteria'
import {
    TrafficRecordVisualisationDefinition
} from '@/modules/traffic-viewer/model/TrafficRecordVisualisationDefinition'
import RecordHistoryItem from '@/modules/traffic-viewer/components/RecordHistoryItem.vue'
import { convertUserToSystemRecordType } from '@/modules/traffic-viewer/model/UserTrafficRecordType'
import { Code, ConnectError } from '@connectrpc/connect'
import { TrafficRecordType } from '@/modules/connection/model/traffic/TrafficRecordType'
import { Duration } from 'luxon'
import { parseHumanDurationToMs } from '@/utils/duration'
import { parseHumanByteSizeToNumber } from '@/utils/number'

// note: this is enum from vuetify, but vuetify doesn't export it
type InfiniteScrollStatus = 'ok' | 'empty' | 'loading' | 'error';

enum TrafficFetchErrorType {
    NoActiveTrafficRecording = 'noActiveTrafficRecording',
    IndexCreating = 'indexCreating'
}

class StartRecordsPointer {
    readonly sinceSessionSequenceId: bigint
    readonly sinceRecordSessionOffset: number

    constructor(sinceSessionSequenceId: bigint) {
        this.sinceSessionSequenceId = sinceSessionSequenceId
        this.sinceRecordSessionOffset = 0
    }
}

class RecordsPointer {
    private _sinceSessionSequenceId: bigint = 1n
    private _sinceRecordSessionOffset: number = 0

    get sinceSessionSequenceId(): bigint {
        return this._sinceSessionSequenceId
    }

    get sinceRecordSessionOffset(): number {
        return this._sinceRecordSessionOffset
    }

    reset(startPointer?: StartRecordsPointer): void {
        this._sinceSessionSequenceId = startPointer?.sinceSessionSequenceId || 1n
        this._sinceRecordSessionOffset = startPointer?.sinceRecordSessionOffset || 0
    }

    move(sinceSessionSequenceId: bigint, sinceRecordSessionOffset: number) {
        this._sinceSessionSequenceId = sinceSessionSequenceId
        this._sinceRecordSessionOffset = sinceRecordSessionOffset
    }
}

const pageSize: number = 20

const trafficViewerService: TrafficViewerService = useTrafficViewerService()
const toaster: Toaster = useToaster()
const { t } = useI18n()

const props = defineProps<{
    dataPointer: TrafficRecordHistoryDataPointer,
    criteria: TrafficRecordHistoryCriteria,
}>()
const emit = defineEmits<{
    (e: 'update:startPointerActive', value: boolean): void
}>()

const fetchError = ref<TrafficFetchErrorType | undefined>(undefined)
let records: TrafficRecord[] = []
const history = ref<TrafficRecordVisualisationDefinition[]>([])

const startPointer = ref<StartRecordsPointer | undefined>(undefined)
watch(startPointer, () => reloadHistory(), { deep: true })
const nextPagePointer = ref<RecordsPointer>(new RecordsPointer())
const limit = ref<number>(pageSize)

const fetchingNewRecordsWhenThereArentAny = ref<boolean>(false)

const selectedSystemRecordTypes = computed<Immutable.List<TrafficRecordType> | undefined>(() => {
    if (props.criteria.types == undefined) {
        return undefined
    }
    return Immutable.List([
        ...(props.criteria.types.flatMap(userType => convertUserToSystemRecordType(userType)!))
    ])
})
const nextPageRequest = computed<TrafficRecordingCaptureRequest>(() => {
    return new TrafficRecordingCaptureRequest(
        TrafficRecordContent.Body,
        props.criteria.since,
        nextPagePointer.value.sinceSessionSequenceId,
        nextPagePointer.value.sinceRecordSessionOffset,
        selectedSystemRecordTypes.value,
        props.criteria.sessionId != undefined
            ? Immutable.List([])
            : undefined,
        props.criteria.longerThanInHumanFormat != undefined
            ? Duration.fromMillis(Number(parseHumanDurationToMs(props.criteria.longerThanInHumanFormat)))
            : undefined,
        props.criteria.fetchingMoreBytesThanInHumanFormat != undefined
            ? parseHumanByteSizeToNumber(props.criteria.fetchingMoreBytesThanInHumanFormat)[0]
            : undefined,
        Immutable.List(props.criteria.labels)
    )
})
const lastRecordRequest = computed<TrafficRecordingCaptureRequest>(() => {
    return new TrafficRecordingCaptureRequest(
        TrafficRecordContent.Body,
        props.criteria.since,
        undefined,
        undefined,
        selectedSystemRecordTypes.value,
        props.criteria.sessionId != undefined
            ? Immutable.List([])
            : undefined,
        props.criteria.longerThanInHumanFormat != undefined
            ? Duration.fromMillis(Number(parseHumanDurationToMs(props.criteria.longerThanInHumanFormat)))
            : undefined,
        props.criteria.fetchingMoreBytesThanInHumanFormat != undefined
            ? parseHumanByteSizeToNumber(props.criteria.fetchingMoreBytesThanInHumanFormat)[0]
            : undefined,
        Immutable.List(props.criteria.labels)
    )
})

async function loadNextHistory({ done }: { done: (status: InfiniteScrollStatus) => void }): Promise<void> {
    try {
        const fetchedRecords: Immutable.List<TrafficRecord> = await fetchRecords()
        fetchError.value = undefined

        if (fetchedRecords.size === 0) {
            toaster.info(t('trafficViewer.recordHistory.list.notification.noNewerRecords'))
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
        const fetchedRecords: Immutable.List<TrafficRecord> = await fetchRecords()
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
        toaster.info(t('trafficViewer.recordHistory.list.notification.noNewerRecords'))
        return
    }
}

async function fetchRecords(): Promise<Immutable.List<TrafficRecord>> {
    return await trafficViewerService.getRecordHistoryList(
        props.dataPointer,
        nextPageRequest.value,
        limit.value
    )
}

function moveNextPagePointer(fetchedRecords: Immutable.List<TrafficRecord>): void {
    const lastFetchedRecord: TrafficRecord = fetchedRecords.last()
    if (lastFetchedRecord.recordSessionOffset < (lastFetchedRecord.sessionRecordsCount - 1)) {
        nextPagePointer.value.move(lastFetchedRecord.sessionSequenceOrder, lastFetchedRecord.recordSessionOffset + 1)
    } else {
        nextPagePointer.value.move(lastFetchedRecord.sessionSequenceOrder + 1n, 0)
    }
}

function pushNewRecords(newRecords: Immutable.List<TrafficRecord>): void {
    for (const newRecord of newRecords) {
        records.push(newRecord)
    }
}

async function processRecords(): Promise<void> {
    // note: we compute the history manually here because for some reason, computed ref wasn't working
    history.value = (await trafficViewerService.processRecords(props.dataPointer, props.criteria, records)).toArray()
}

function handleRecordFetchError(e: any): void {
    if (e instanceof ConnectError && e.code === Code.InvalidArgument) {
        // todo lho rework when connect library can provide metadata
        if (e.message.toLowerCase().includes('no on-demand traffic recording has been started')) {
            fetchError.value = TrafficFetchErrorType.NoActiveTrafficRecording
            return
        }
        if (e.message.toLowerCase().includes('issuing creation') || e.message.toLowerCase().includes('index is currently being build')) {
            fetchError.value = TrafficFetchErrorType.IndexCreating
            return
        }
    }
    toaster.error(t(
        'trafficViewer.recordHistory.notification.couldNotLoadRecords',
        { reason: e.message }
    ))
}

async function moveStartPointerToNewest(): Promise<void> {
    try {
        const latestRecords: Immutable.List<TrafficRecord> = await trafficViewerService.getRecordHistoryList(
            props.dataPointer,
            lastRecordRequest.value,
            1,
            true
        )
        if (latestRecords.size === 0) {
            startPointer.value = undefined
            emit('update:startPointerActive', false)
        } else {
            const latestRecord: TrafficRecord = latestRecords.get(0)!
            startPointer.value = new StartRecordsPointer(latestRecord.sessionSequenceOrder + 1n)
            emit('update:startPointerActive', true)
        }
    } catch (e: any) {
        toaster.error(t(
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
                <RecordHistoryItem :visualisation-definition="visualisationDefinition as TrafficRecordVisualisationDefinition" />
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
        v-else-if="fetchError === TrafficFetchErrorType.NoActiveTrafficRecording"
        icon="mdi-alert-circle-outline"
        color="error"
        :title="t('trafficViewer.recordHistory.list.info.noActiveTrafficRecording', { catalogName: dataPointer.catalogName })"
    />

    <VMissingDataIndicator
        v-else-if="fetchError === TrafficFetchErrorType.IndexCreating"
        icon="mdi-information-outline"
        color="warning"
        :title="t('trafficViewer.recordHistory.list.info.indexCreating', { catalogName: dataPointer.catalogName })"
    >
        <template #actions>
            <VBtn :loading="fetchingNewRecordsWhenThereArentAny" @click="tryReloadHistoryForPossibleNewRecords">
                {{ t('trafficViewer.recordHistory.button.reloadRecordHistory') }}
            </VBtn>
        </template>
    </VMissingDataIndicator>

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
