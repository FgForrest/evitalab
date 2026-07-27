<script setup lang="ts">
import { errorMessage } from '@/utils/error'

import VTabToolbar from '@/modules/base/component/VTabToolbar.vue'
import { List } from 'immutable'
import { useI18n } from 'vue-i18n'
import type { TabComponentEvents } from '@/modules/workspace/tab/model/TabComponentEvents'
import type { TabComponentProps } from '@/modules/workspace/tab/model/TabComponentProps'
import { ServerViewerTabParams } from '@/modules/server-viewer/model/ServerViewerTabParams'
import { VoidTabData } from '@/modules/workspace/tab/model/void/VoidTabData'
import { onUnmounted, ref } from 'vue'
import { ServerViewerService, useServerViewerService } from '@/modules/server-viewer/service/ServerViewerService'
import { useToaster } from '@/modules/notification/service/Toaster'
import type { Toaster } from '@/modules/notification/service/Toaster'
import ServerTitle from '@/modules/server-viewer/component/ServerTitle.vue'
import ServerStatusComponent from '@/modules/server-viewer/component/server-status/ServerStatus.vue'
import VMissingDataIndicator from '@/modules/base/component/VMissingDataIndicator.vue'
import type { TabComponentExpose } from '@/modules/workspace/tab/model/TabComponentExpose'
import { SubjectPath } from '@/modules/workspace/status-bar/model/subject-path-status/SubjectPath'
import {
    ConnectionSubjectPath
} from '@/modules/connection/workspace/status-bar/model/subject-path-status/ConnectionSubjectPath'
import { SubjectPathItem } from '@/modules/workspace/status-bar/model/subject-path-status/SubjectPathItem'
import { ServerViewerTabDefinition } from '@/modules/server-viewer/model/ServerViewerTabDefinition'
import { ServerStatus } from '@/modules/database-driver/request-response/status/ServerStatus'

const reloadInterval: number = 5000

const serverViewerService: ServerViewerService = useServerViewerService()
const toaster: Toaster = useToaster()
const { t } = useI18n()

const props = defineProps<TabComponentProps<ServerViewerTabParams, VoidTabData>>()
const emit = defineEmits<TabComponentEvents>()
defineExpose<TabComponentExpose>({
    path(): SubjectPath | undefined {
        return new ConnectionSubjectPath(
            props.params.connection,
            [SubjectPathItem.significant(
                ServerViewerTabDefinition.icon(),
                t('serverViewer.title')
            )]
        )
    }
})

const initialized = ref<boolean>(false)
const title: List<string> = List.of(t('serverViewer.title'))

const detailRef = ref<typeof ServerStatusComponent>()

const serverStatus = ref<ServerStatus>()
const serverAvailable = ref<boolean>(true)

async function loadServerStatus(silent: boolean = false, forceRefresh: boolean = false): Promise<boolean> {
    try {
        serverStatus.value = await serverViewerService.getServerStatus(forceRefresh)
        return true
    } catch (e) {
        if (!silent) {
            await toaster.error(t(
                'serverViewer.notification.couldNotLoad',
                { reason: errorMessage(e) }
            ))
        }
        return false
    }
}

let reloadTimeoutId: ReturnType<typeof setTimeout> | undefined = undefined
async function reload(manual: boolean = false): Promise<void> {
    // background polls stay silent to avoid toast spam; a manual reload surfaces the error
    const available: boolean = await loadServerStatus(!manual, true)
    serverAvailable.value = available
    if (available) {
        await detailRef.value?.reload()
    }
    // keep polling either way so the viewer recovers on its own once the server is back
    scheduleReload()
}

function scheduleReload(): void {
    if (reloadTimeoutId != undefined) {
        clearTimeout(reloadTimeoutId)
    }
    reloadTimeoutId = setTimeout(() => reload(), reloadInterval)
}

loadServerStatus().then((loaded) => {
    serverAvailable.value = loaded
    initialized.value = true
    emit('ready')

    scheduleReload()
})

onUnmounted(() => {
    if (reloadTimeoutId != undefined) {
        clearTimeout(reloadTimeoutId)
    }
})
</script>

<template>
    <div v-if="initialized" class="server-status">
        <VTabToolbar :prepend-icon="ServerViewerTabDefinition.icon()" :title="title">
            <template #append>
                <VBtn icon @click="reload(true)">
                    <VIcon>mdi-refresh</VIcon>
                    <VTooltip activator="parent">
                        {{ t('serverViewer.button.reload') }}
                    </VTooltip>
                </VBtn>
            </template>
        </VTabToolbar>

        <VSheet class="server-status__body">
            <div v-if="serverAvailable" class="tiles">
                <ServerTitle :server-status="serverStatus!" />

                <div class="tiles__row">
                    <ServerStatusComponent
                        ref="detailRef"
                        :server-status="serverStatus!"
                    />
                </div>
            </div>
            <VMissingDataIndicator
                v-else
                icon="mdi-server-network-off"
                :title="t('serverViewer.unavailable.title')"
            >
                <template #actions>
                    <VBtn prepend-icon="mdi-refresh" @click="reload(true)">
                        {{ t('serverViewer.button.reload') }}
                    </VBtn>
                </template>
            </VMissingDataIndicator>
        </VSheet>
    </div>
</template>

<style lang="scss" scoped>
.server-status {
    display: grid;
    grid-template-rows: 3rem 1fr;

    &__body {
        position: absolute;
        left: 0;
        right: 0;
        top: 3rem;
        bottom: 0;
        overflow-y: auto;

        padding: 1.5rem;
    }
}

.tiles {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;

    &__row {
        display: flex;
        flex-wrap: wrap;
    }
}
</style>
