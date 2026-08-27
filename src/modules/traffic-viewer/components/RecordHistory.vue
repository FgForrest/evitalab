<script setup lang="ts">
import { errorMessage } from '@/utils/error'

/**
 * Lists traffic recording history
 */

import VMissingDataIndicator from '@/modules/base/component/VMissingDataIndicator.vue'
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToaster } from '@/modules/notification/service/Toaster'
import type { Toaster } from '@/modules/notification/service/Toaster'
import { TrafficViewerService, useTrafficViewerService } from '@/modules/traffic-viewer/service/TrafficViewerService'
import { TrafficRecordHistoryDataPointer } from '@/modules/traffic-viewer/model/TrafficRecordHistoryDataPointer'
import { List as ImmutableList } from 'immutable'
import { TrafficRecord } from '@/modules/database-driver/request-response/traffic-recording/TrafficRecord'
import VListItemDivider from '@/modules/base/component/VListItemDivider.vue'
import { TrafficRecordHistoryCriteria } from '@/modules/traffic-viewer/model/TrafficRecordHistoryCriteria'
import {
    TrafficRecordVisualisationDefinition
} from '@/modules/traffic-viewer/model/TrafficRecordVisualisationDefinition'
import RecordHistoryItem from '@/modules/traffic-viewer/components/RecordHistoryItem.vue'
import { Code, ConnectError } from '@connectrpc/connect'
import { TrafficRecordHistoryCursor } from '@/modules/traffic-viewer/model/TrafficRecordHistoryCursor'
import {
    createTrafficRecordHistoryRequest,
    prependOlderTrafficRecords
} from '@/modules/traffic-viewer/service/trafficRecordHistoryPaging'

// note: this is enum from vuetify, but vuetify doesn't export it
type InfiniteScrollStatus = 'ok' | 'empty' | 'loading' | 'error';

enum TrafficFetchErrorType {
    NoActiveTrafficRecording = 'noActiveTrafficRecording',
    IndexCreating = 'indexCreating'
}

/**
 * Oldest session the record history may reach. Set by the user through the start pointer button.
 */
class StartRecordsPointer {
    readonly sinceSessionSequenceId: bigint

    constructor(sinceSessionSequenceId: bigint) {
        this.sinceSessionSequenceId = sinceSessionSequenceId
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
    (e: 'update:startPointerActive', value: boolean): void,
    (e: 'update:recorderAvailable', value: boolean): void
}>()

const fetchError = ref<TrafficFetchErrorType | undefined>(undefined)
let records: TrafficRecord[] = []
const history = ref<TrafficRecordVisualisationDefinition[]>([])

const startPointer = ref<StartRecordsPointer | undefined>(undefined)
watch(startPointer, () => reloadHistory(), { deep: true })
let cursor: TrafficRecordHistoryCursor = new TrafficRecordHistoryCursor()

const fetchingNewRecordsWhenThereArentAny = ref<boolean>(false)

/**
 * Loads the page of records preceding the ones already loaded and prepends it, i.e. extends the list
 * towards older traffic.
 */
async function loadOlderHistory({ done }: { done: (status: InfiniteScrollStatus) => void }): Promise<void> {
    if (cursor.exhausted) {
        await toaster.info(t('trafficViewer.recordHistory.list.notification.noOlderRecords'))
        done('ok')
        return
    }

    try {
        const fetchedRecords: ImmutableList<TrafficRecord> = await fetchRecords()
        fetchError.value = undefined

        if (fetchedRecords.size === 0) {
            await toaster.info(t('trafficViewer.recordHistory.list.notification.noOlderRecords'))
            done('ok')
            return
        }

        moveCursorBeforeFetchedPage(fetchedRecords)
        const reachableRecords: TrafficRecord[] = keepReachableRecords(fetchedRecords)
        if (reachableRecords.length === 0) {
            await toaster.info(t('trafficViewer.recordHistory.list.notification.noOlderRecords'))
            done('ok')
            return
        }

        records = prependOlderTrafficRecords(records, reachableRecords)
        await processRecords()
        done('ok')
    } catch (e) {
        handleRecordFetchError(e)
        done('error')
    } finally {
        emitRecorderAvailability()
    }
}

/**
 * Discards everything loaded so far and re-anchors the list at the newest records the server has. This is
 * how new traffic enters the list.
 */
async function reloadHistory(): Promise<void> {
    cursor = new TrafficRecordHistoryCursor(startPointer.value?.sinceSessionSequenceId)
    records = []
    history.value = []
    fetchError.value = undefined

    try {
        const fetchedRecords: ImmutableList<TrafficRecord> = await fetchRecords()
        if (fetchedRecords.size === 0) {
            return
        }

        moveCursorBeforeFetchedPage(fetchedRecords)
        records = prependOlderTrafficRecords([], keepReachableRecords(fetchedRecords))
        if (records.length === 0) {
            return
        }
        await processRecords()
    } catch (e) {
        handleRecordFetchError(e)
    } finally {
        emitRecorderAvailability()
    }
}

/**
 * Notifies the parent whether the server has a traffic recorder installed for the catalog, which is what
 * the failed history fetch tells us. Actions working with the traffic buffer are available only then.
 */
function emitRecorderAvailability(): void {
    emit('update:recorderAvailable', fetchError.value !== TrafficFetchErrorType.NoActiveTrafficRecording)
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

/**
 * Reads a page of the history from the current cursor position. The read is always reversed, so the page
 * arrives with its newest record first.
 */
async function fetchRecords(): Promise<ImmutableList<TrafficRecord>> {
    return await trafficViewerService.getRecordHistoryList(
        props.dataPointer.catalogName,
        createTrafficRecordHistoryRequest(props.criteria, cursor.sinceSessionSequenceId, cursor.sinceRecordSessionOffset),
        pageSize,
        true
    )
}

function moveCursorBeforeFetchedPage(fetchedRecords: ImmutableList<TrafficRecord>): void {
    const oldestFetchedRecord: TrafficRecord = fetchedRecords.last()!
    cursor.moveBefore(oldestFetchedRecord.sessionSequenceOrder, oldestFetchedRecord.recordSessionOffset)
}

/**
 * Drops records the start pointer excludes. The server cannot express such lower bound on a reversed read.
 */
function keepReachableRecords(fetchedRecords: ImmutableList<TrafficRecord>): TrafficRecord[] {
    return fetchedRecords
        .filter(record => cursor.covers(record.sessionSequenceOrder))
        .toArray()
}

async function processRecords(): Promise<void> {
    // note: we compute the history manually here because for some reason, computed ref wasn't working
    const visualisedRecords: ImmutableList<TrafficRecordVisualisationDefinition> =
        await trafficViewerService.processRecords(props.dataPointer.catalogName, props.criteria, records)
    // the records have to be processed oldest first, so that a record can be attached to the session it
    // belongs to, but the list shows the newest traffic at the top
    history.value = visualisedRecords.reverse().toArray()
}

function handleRecordFetchError(e: unknown): void {
    if (e instanceof ConnectError && e.code === Code.InvalidArgument) {
        // the classification is message-based because nothing structured discriminates these two states yet: the
        // server does attach a `google.rpc.ErrorInfo` whose domain is the exception class name, but the missing
        // recording is reported as a plain `EvitaInvalidUsageException`, and the error code is derived from the throw
        // site, so it changes between server versions. Both would need a dedicated exception type in evitaDB first.
        if (errorMessage(e).toLowerCase().includes('no on-demand traffic recording has been started')) {
            fetchError.value = TrafficFetchErrorType.NoActiveTrafficRecording
            return
        }
        if (errorMessage(e).toLowerCase().includes('issuing creation') || errorMessage(e).toLowerCase().includes('index is currently being build')) {
            fetchError.value = TrafficFetchErrorType.IndexCreating
            return
        }
    }
    toaster.error(t(
        'trafficViewer.recordHistory.notification.couldNotLoadRecords',
        { reason: errorMessage(e) }
    )).then()
}

async function moveStartPointerToNewest(): Promise<void> {
    try {
        const latestRecords: ImmutableList<TrafficRecord> = await trafficViewerService.getRecordHistoryList(
            props.dataPointer.catalogName,
            createTrafficRecordHistoryRequest(props.criteria),
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
    } catch (e) {
        await toaster.error(t(
            'trafficViewer.recordHistory.notification.couldNotLoadLatestRecording',
            { reason: errorMessage(e) }
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
            @load="loadOlderHistory"
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
                    {{ t('trafficViewer.recordHistory.list.button.loadOlder') }}
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
