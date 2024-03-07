<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { SchemaViewerService, useSchemaViewerService } from '@/services/editor/schema-viewer.service'
import { Toaster, useToaster } from '@/services/editor/toaster'
import VTabToolbar from '@/components/base/VTabToolbar.vue'
import LabEditorTabShareButton from '@/components/lab/editor/tab/LabEditorTabShareButton.vue'

import { Keymap, useKeymap } from '@/model/editor/keymap/Keymap'
import { Command } from '@/model/editor/keymap/Command'
import { TabComponentProps } from '@/model/editor/tab/TabComponentProps'
import { SchemaViewerParams } from '@/model/editor/tab/schemaViewer/SchemaViewerParams'
import { VoidTabRequestComponentData } from '@/model/editor/tab/void/VoidTabRequestComponentData'
import { TabComponentEvents } from '@/model/editor/tab/TabComponentEvents'
import { TabType } from '@/model/editor/tab/TabType'

const keymap: Keymap = useKeymap()
const schemaViewerService: SchemaViewerService = useSchemaViewerService()
const toaster: Toaster = useToaster()

const props = defineProps<TabComponentProps<SchemaViewerParams, VoidTabRequestComponentData>>()
const emit = defineEmits<TabComponentEvents>()

const shareTabButtonRef = ref<InstanceType<typeof LabEditorTabShareButton> | null>(null)

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
            prepend-icon="mdi-file-code"
            :path="params.dataPointer.schemaPointer.path()"
        >
            <template #append>
                <LabEditorTabShareButton
                    ref="shareTabButtonRef"
                    :tab-type="TabType.SchemaViewer"
                    :tab-params="params!"
                    :tab-data="undefined"
                    :disabled="!params.dataPointer.connection.preconfigured"
                />
            </template>
        </VTabToolbar>

        <VSheet class="schema-viewer__body">
            <component
                :is="params.dataPointer.schemaPointer.component()"
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
