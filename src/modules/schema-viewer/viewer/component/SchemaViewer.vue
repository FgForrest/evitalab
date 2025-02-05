<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { Keymap, useKeymap } from '@/modules/keymap/service/Keymap'
import { SchemaViewerService, useSchemaViewerService } from '@/modules/schema-viewer/viewer/service/SchemaViewerService'
import { Toaster, useToaster } from '@/modules/notification/service/Toaster'
import { TabComponentProps } from '@/modules/workspace/tab/model/TabComponentProps'
import { TabComponentEvents } from '@/modules/workspace/tab/model/TabComponentEvents'
import { SchemaViewerTabParams } from '@/modules/schema-viewer/viewer/workspace/model/SchemaViewerTabParams'
import { VoidTabData } from '@/modules/workspace/tab/model/void/VoidTabData'
import ShareTabButton from '@/modules/workspace/tab/component/ShareTabButton.vue'
import { Command } from '@/modules/keymap/model/Command'
import VTabToolbar from '@/modules/base/component/VTabToolbar.vue'
import { TabType } from '@/modules/workspace/tab/model/TabType'
import { TabComponentExpose } from '@/modules/workspace/tab/model/TabComponentExpose'
import { SubjectPath } from '@/modules/workspace/status-bar/model/subject-path-status/SubjectPath'
import Immutable from 'immutable'
import { SchemaViewerTabDefinition } from '@/modules/schema-viewer/viewer/workspace/model/SchemaViewerTabDefinition'
import { SchemaPointer } from '@/modules/schema-viewer/viewer/model/SchemaPointer'
import { useI18n } from 'vue-i18n'
import { SchemaType } from '@/modules/schema-viewer/viewer/model/SchemaType'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { SchemaPathFactory } from '@/modules/schema-viewer/viewer/service/schema-path-factory/SchemaPathFactory'
import {
    useSchemaPathFactory
} from '@/modules/schema-viewer/viewer/service/schema-path-factory/DelegatingSchemaPathFactory'

const keymap: Keymap = useKeymap()
const schemaViewerService: SchemaViewerService = useSchemaViewerService()
const schemaPathFactory: SchemaPathFactory<any> = useSchemaPathFactory()
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
    }
})

const title: Immutable.List<string> = (() => {
    const schemaPointer: SchemaPointer = props.params.dataPointer.schemaPointer

    if (schemaPointer.schemaType === SchemaType.Catalog) {
        return Immutable.List.of(schemaPointer.schemaName)
    } else {
        return Immutable.List.of(
            t(`schemaViewer.title.schema.${schemaPointer.schemaType}`),
            schemaPointer.schemaName
        )
    }
})()

const shareTabButtonRef = ref<InstanceType<typeof ShareTabButton> | null>(null)

const schemaLoaded = ref<boolean>(false)
const schema = ref<any>()
schemaViewerService.getSchema(props.params.dataPointer)
    .catch(error => {
        toaster.error(error)
    })
    .then(s => {
        schema.value = s
        schemaLoaded.value = true
        emit('ready')
    })

onMounted(() => {
    // register schema viewer specific keyboard shortcuts
    keymap.bind(Command.SchemaViewer_ShareTab, props.id, () => shareTabButtonRef.value?.share())
})
onUnmounted(() => {
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
                    :disabled="!params.dataPointer.connection.preconfigured"
                    :command="Command.SchemaViewer_ShareTab"
                />
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
