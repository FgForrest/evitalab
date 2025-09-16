<script setup lang="ts">

import VTabToolbar from '@/modules/base/component/VTabToolbar.vue'
import type { TabComponentProps } from '@/modules/workspace/tab/model/TabComponentProps'
import type { TabComponentEvents } from '@/modules/workspace/tab/model/TabComponentEvents'
import type { TabComponentExpose } from '@/modules/workspace/tab/model/TabComponentExpose'
import { SubjectPath } from '@/modules/workspace/status-bar/model/subject-path-status/SubjectPath'
import {
    ConnectionSubjectPath
} from '@/modules/connection/workspace/status-bar/model/subject-path-status/ConnectionSubjectPath'
import { SubjectPathItem } from '@/modules/workspace/status-bar/model/subject-path-status/SubjectPathItem'
import { useI18n } from 'vue-i18n'
import { onBeforeMount, ref } from 'vue'
import { List } from 'immutable'
import { Keymap, useKeymap } from '@/modules/keymap/service/Keymap'
import type { VoidTabData } from '@/modules/workspace/tab/model/void/VoidTabData.ts'
import { MutationHistoryViewerTabDefinition } from '@/modules/history-viewer/model/MutationHistoryViewerTabDefinition.ts'
import type { MutationHistoryViewerTabParams } from '@/modules/history-viewer/model/MutationHistoryViewerTabParams.ts'
import { useMutationHistoryViewerService } from '@/modules/history-viewer/service/MutationHistoryViewerService.ts'
import { PaginatedList } from '@/modules/database-driver/request-response/PaginatedList.ts'
import { type Toaster, useToaster } from '@/modules/notification/service/Toaster.ts'

const keymap: Keymap = useKeymap()
const toaster: Toaster = useToaster()

const mutationHistoryViewerService = useMutationHistoryViewerService();
const { t } = useI18n()
const recordings = ref<any | undefined>()

const props = defineProps<TabComponentProps<MutationHistoryViewerTabParams, VoidTabData>>()
const emit = defineEmits<TabComponentEvents>()
defineExpose<TabComponentExpose>({
    path(): SubjectPath | undefined {
        return new ConnectionSubjectPath(
            props.params.connection,
            [
                SubjectPathItem.plain(props.params.catalogName),
                SubjectPathItem.significant(
                    MutationHistoryViewerTabDefinition.icon(),
                    t('mutationHistoryViewer.title')
                )
            ]
        )
    }
})

const title: List<string> = List.of(
    props.params.catalogName,
    t('mutationHistoryViewer.title')
)


async function loadHistoryMutations(): Promise<boolean> {
    try {
        console.log(`Getting data from ${props.params.catalogName} catalog`)
        recordings.value = await mutationHistoryViewerService.getMutationHistory(props.params.catalogName)

        return true
    } catch (e: any) {
        console.error(e)
        await toaster.error(t(
            'mutationHistoryViewer.recordings.notification.couldNotLoadRecordings',
            { reason: e.message }
        ))
        return false
    }
}

loadHistoryMutations()


onBeforeMount(() => {
    emit('ready')
})

</script>

<template>
    <div class="history-recording-viewer">
        <VTabToolbar
            :prepend-icon="MutationHistoryViewerTabDefinition.icon()"
            :title="title"
            :extension-height="64"
        >

        </VTabToolbar>

        <VSheet class="history-recording-viewer__body">
            {{ JSON.stringify(recordings) }}
        </VSheet>
    </div>
</template>

<style lang="scss" scoped>
.history-recording-viewer {
    display: grid;
    grid-template-rows: 6.5rem 1fr;

    &__body {
        position: absolute;
        left: 0;
        right: 0;
        top: 6.5rem;
        bottom: 0;
        overflow-y: auto;
        padding: 0 1rem;
    }
}
</style>
