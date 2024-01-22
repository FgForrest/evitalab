<script setup lang="ts">
import { SchemaViewerParams } from '@/model/editor/schema-viewer'
import { ref } from 'vue'
import { SchemaViewerService, useSchemaViewerService } from '@/services/editor/schema-viewer.service'
import { Toaster, useToaster } from '@/services/editor/toaster'
import { TabComponentEvents, TabComponentProps, VoidTabRequestComponentData } from '@/model/editor/editor'
import VTabToolbar from '@/components/base/VTabToolbar.vue'
import LabEditorTabShareButton from '@/components/lab/editor/tab/LabEditorTabShareButton.vue'

import { TabType } from '@/model/editor/tab/tab-type'

const schemaViewerService: SchemaViewerService = useSchemaViewerService()
const toaster: Toaster = useToaster()

const props = defineProps<TabComponentProps<SchemaViewerParams, VoidTabRequestComponentData>>()
const emit = defineEmits<TabComponentEvents>()

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
                    :tab-type="TabType.SchemaViewer"
                    :tab-params="params"
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

    &__header {
        z-index: 100;
    }

    &__body {
        position: relative;
    }
}
</style>
