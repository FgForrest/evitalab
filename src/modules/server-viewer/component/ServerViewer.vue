<script setup lang="ts">

import VTabToolbar from '@/modules/base/component/VTabToolbar.vue'
import { List } from 'immutable'
import { useI18n } from 'vue-i18n'
import { TabComponentEvents } from '@/modules/workspace/tab/model/TabComponentEvents'
import { TabComponentProps } from '@/modules/workspace/tab/model/TabComponentProps'
import { ServerViewerTabParams } from '@/modules/server-viewer/model/ServerViewerTabParams'
import { VoidTabData } from '@/modules/workspace/tab/model/void/VoidTabData'
import { onUnmounted, ref } from 'vue'
import { ServerStatus } from '@/modules/connection/model/status/ServerStatus'
import { ServerViewerService, useServerViewerService } from '@/modules/server-viewer/service/ServerViewerService'
import { Toaster, useToaster } from '@/modules/notification/service/Toaster'
import ServerTitle from '@/modules/server-viewer/component/ServerTitle.vue'
import ServerStatusComponent from '@/modules/server-viewer/component/server-status/ServerStatus.vue'
import { TabComponentExpose } from '@/modules/workspace/tab/model/TabComponentExpose'
import { SubjectPath } from '@/modules/workspace/status-bar/model/subject-path-status/SubjectPath'
import {
    ConnectionSubjectPath
} from '@/modules/connection/workspace/status-bar/model/subject-path-status/ConnectionSubjectPath'
import { SubjectPathItem } from '@/modules/workspace/status-bar/model/subject-path-status/SubjectPathItem'
import { ServerViewerTabDefinition } from '@/modules/server-viewer/model/ServerViewerTabDefinition'

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
const serverStatusLoaded = ref<boolean>(false)

async function loadServerStatus(): Promise<boolean> {
    try {
        serverStatus.value = await serverViewerService.getServerStatus(props.params.connection)
        if (!serverStatusLoaded.value) {
            serverStatusLoaded.value = true
        }
        return true
    } catch (e: any) {
        await toaster.error(t(
            'serverViewer.notification.couldNotLoad',
            { reason: e.message }
        ))
        return false
    }
}

let canReload: boolean = true
let reloadTimeoutId: ReturnType<typeof setTimeout> | undefined = undefined
async function reload(manual: boolean = false): Promise<void> {
    if (!canReload && !manual) {
        return
    }

    const loadedStatus: boolean = await loadServerStatus()
    const detailReloaded: boolean = await detailRef.value?.reload()
    if (loadedStatus && detailReloaded) {
        if (manual && canReload) {
            // do nothing if the reloading process is working and user
            // requests additional reload in between
        } else {
            // set new timeout only for automatic reload or reload recovery
            reloadTimeoutId = setTimeout(reload, reloadInterval)
        }
        canReload = true
    } else {
        // we don't want to spam user server is down, user needs to refresh manually
        canReload = false
    }
}

loadServerStatus().then((loaded) => {
    if (!loaded) {
        return
    }

    initialized.value = true
    emit('ready')

    reloadTimeoutId = setTimeout(reload, reloadInterval)
})

onUnmounted(() => clearInterval(reloadInterval))
</script>

<template>
    <div v-if="initialized" class="server-status">
        <VTabToolbar :prepend-icon="ServerViewerTabDefinition.icon()" :title="title">
            <template #append>
                <VBtn icon @click="reload">
                    <VIcon>mdi-refresh</VIcon>
                    <VTooltip activator="parent">
                        {{ t('serverViewer.button.reload') }}
                    </VTooltip>
                </VBtn>
            </template>
        </VTabToolbar>

        <VSheet class="server-status__body">
            <div class="tiles">
                <ServerTitle :server-status="serverStatus!" />

                <div class="tiles__row">
                    <ServerStatusComponent
                        ref="detailRef"
                        :connection="params.connection"
                        :server-status="serverStatus!"
                    />
                </div>
            </div>
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
