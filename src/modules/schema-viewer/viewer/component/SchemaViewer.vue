<script setup lang="ts">
import { asError } from '@/utils/error'
import { onBeforeMount, onMounted, onUnmounted, ref } from 'vue'
import { Keymap, useKeymap } from '@/modules/keymap/service/Keymap'
import { SchemaViewerService, useSchemaViewerService } from '@/modules/schema-viewer/viewer/service/SchemaViewerService'
import type { Toaster } from '@/modules/notification/service/Toaster'
import { useToaster } from '@/modules/notification/service/Toaster'
import type { TabComponentProps } from '@/modules/workspace/tab/model/TabComponentProps'
import type { TabComponentEvents } from '@/modules/workspace/tab/model/TabComponentEvents'
import { SchemaViewerTabParams } from '@/modules/schema-viewer/viewer/workspace/model/SchemaViewerTabParams'
import { VoidTabData } from '@/modules/workspace/tab/model/void/VoidTabData'
import ShareTabButton from '@/modules/workspace/tab/component/ShareTabButton.vue'
import { Command } from '@/modules/keymap/model/Command'
import VTabToolbar from '@/modules/base/component/VTabToolbar.vue'
import { TabType } from '@/modules/workspace/tab/model/TabType'
import type { TabComponentExpose } from '@/modules/workspace/tab/model/TabComponentExpose'
import { SubjectPath } from '@/modules/workspace/status-bar/model/subject-path-status/SubjectPath'
import { List as ImmutableList } from 'immutable'
import { SchemaViewerTabDefinition } from '@/modules/schema-viewer/viewer/workspace/model/SchemaViewerTabDefinition'
import type { SchemaPointer } from '@/modules/schema-viewer/viewer/model/SchemaPointer'
import { useI18n } from 'vue-i18n'
import { SchemaType } from '@/modules/schema-viewer/viewer/model/SchemaType'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import type { SchemaPathFactory } from '@/modules/schema-viewer/viewer/service/schema-path-factory/SchemaPathFactory'
import {
    useSchemaPathFactory
} from '@/modules/schema-viewer/viewer/service/schema-path-factory/DelegatingSchemaPathFactory'
import VActionTooltip from '@/modules/base/component/VActionTooltip.vue'

import type { Schema } from '@/modules/database-driver/request-response/schema/Schema'
const keymap: Keymap = useKeymap()
const schemaViewerService: SchemaViewerService = useSchemaViewerService()
const schemaPathFactory: SchemaPathFactory<SchemaPointer> = useSchemaPathFactory()
const toaster: Toaster = useToaster()
const { t } = useI18n()

const props = defineProps<TabComponentProps<SchemaViewerTabParams, VoidTabData>>()
const emit = defineEmits<TabComponentEvents>()
defineExpose<TabComponentExpose>({
    path(): SubjectPath | undefined {
        const schemaPointer: SchemaPointer = props.params.dataPointer.schemaPointer
        if (!schemaPathFactory.applies(schemaPointer)) {
            throw new UnexpectedError('Cannot apply schema path factory.')
        }
        return schemaPathFactory.resolvePath(props.params.dataPointer.connection, schemaPointer)
    },
    retry(): void {
        initialize()
    }
})

// registered at setup top level on purpose: a retry does not remount the component (the tab framework keeps
// it alive and only re-runs `initialize()`), so this registration must outlive every retry and is released
// exactly once, in `onUnmounted`
const schemaChangeCallbackId = schemaViewerService.registerSchemaChangeCallback(
    props.params.dataPointer,
    async () => await reportedLoadSchema()
)

const shareTabButtonRef = ref<InstanceType<typeof ShareTabButton> | null>(null)

const schemaLoaded = ref<boolean>(false)
const schema = ref<Schema | undefined>()
const reloadingSchema = ref<boolean>(false)

const title: ImmutableList<string> = (() => {
    const schemaPointer: SchemaPointer = props.params.dataPointer.schemaPointer
    if (schemaPointer.schemaType === SchemaType.Catalog) {
        return ImmutableList.of(schemaPointer.schemaName)
    }
    return ImmutableList.of(
        t(`schemaViewer.title.schema.${schemaPointer.schemaType}`),
        schemaPointer.schemaName
    )
})()

async function loadSchema(): Promise<void> {
    schema.value = await schemaViewerService.getSchema(props.params.dataPointer)
}

/**
 * Loads the schema and marks the tab ready. On any failure — including the fetch exceeding the driver's call
 * deadline — reports the error to the tab framework so it can offer a retry, instead of rendering the tab
 * with no schema at all. Reused by both mount and retry.
 */
function initialize(): void {
    loadSchema()
        .then(() => {
            schemaLoaded.value = true
            emit('ready')
        })
        .catch(e => {
            emit('error', asError(e))
        })
}

/**
 * Reloads the schema of an already-working tab. Unlike {@link initialize} it only reports the failure, because
 * a background reload must never replace displayed content with an error screen.
 */
async function reportedLoadSchema(): Promise<void> {
    try {
        await loadSchema()
    } catch (e) {
        await toaster.error(t('schemaViewer.notification.couldNotLoadSchema'), asError(e))
    }
}

async function reloadSchema(): Promise<void> {
    reloadingSchema.value = true
    try {
        // fetches first and, when the schema really changed, calls the registered callback which loads it
        await schemaViewerService.refreshSchema(props.params.dataPointer)
    } catch (e) {
        await toaster.error(t('schemaViewer.notification.failedToReloadSchema'), asError(e))
    } finally {
        reloadingSchema.value = false
    }
}

onBeforeMount(() => {
    initialize()
})
onMounted(() => {
    // register schema viewer specific keyboard shortcuts
    keymap.bind(Command.SchemaViewer_ShareTab, props.id, () => shareTabButtonRef.value?.share())
})
onUnmounted(() => {
    schemaViewerService.unregisterSchemaChangeCallback(
        props.params.dataPointer,
        schemaChangeCallbackId
    )

    // unregister schema viewer specific keyboard shortcuts
    keymap.unbind(Command.SchemaViewer_ShareTab, props.id)
})
</script>

<template>
    <div
        v-if="schemaLoaded"
        class="schema-viewer"
    >
        <VTabToolbar
            :prepend-icon="SchemaViewerTabDefinition.icon()"
            :title="title"
        >
            <template #append>
                <ShareTabButton
                    ref="shareTabButtonRef"
                    :tab-type="TabType.SchemaViewer"
                    :tab-params="params!"
                    :tab-data="undefined"
                    :command="Command.SchemaViewer_ShareTab"
                />
                <VBtn :loading="reloadingSchema" icon @click="reloadSchema()">
                    <VIcon>mdi-refresh</VIcon>
                    <VActionTooltip activator="parent">
                        {{ t('common.button.reload') }}
                    </VActionTooltip>
                </VBtn>
            </template>
        </VTabToolbar>

        <VSheet class="schema-viewer__body">
            <component
                :is="params.dataPointer.schemaPointer.component"
                :data-pointer="params.dataPointer"
                :schema="schema"
            />
        </VSheet>
    </div>
</template>

<style lang="scss" scoped>
.schema-viewer {
    display: grid;
    grid-template-rows: 3rem 1fr;

    &__body {
        position: relative;
    }
}
</style>
