<script setup lang="ts">
import { computed } from 'vue'
import VTabToolbar from '@/components/base/VTabToolbar.vue'
import VPreviewEditor from '@/components/base/VPreviewEditor.vue'
import { TabComponentProps } from '@/model/editor/tab/TabComponentProps'
import { ErrorViewerParams } from '@/model/editor/tab/errorViewer/ErrorViewerParams'
import { VoidTabRequestComponentData } from '@/model/editor/tab/void/VoidTabRequestComponentData'
import { TabComponentEvents } from '@/model/editor/tab/TabComponentEvents'

const props = defineProps<TabComponentProps<ErrorViewerParams, VoidTabRequestComponentData>>()
const emit = defineEmits<TabComponentEvents>()

const title = computed(() => {
    return props.params.error.name
})

const detail = computed(() => {
    if (props.params.error.detail == undefined) {
        return 'No details available.'
    }
    return props.params.error.detail
})

emit('ready')
</script>

<template>
    <div class="error-viewer">
        <VTabToolbar
            prepend-icon="mdi-alert-outline"
            :path="[title]"
        >
            <!-- todo lho link to submit an issue to github -->
            <template #append>
                <VBtn
                    icon
                    density="compact"
                >
                    <VIcon>mdi-bug</VIcon>
                    <VTooltip activator="parent">
                        Submit an issue
                    </VTooltip>
                </VBtn>
            </template>
        </VTabToolbar>

        <VSheet class="error-viewer__body">
            <VPreviewEditor :model-value="detail"/>
        </VSheet>
    </div>
</template>

<style lang="scss" scoped>
.error-viewer {
    display: grid;
    grid-template-rows: 3rem 1fr;

    &__body {
        position: relative;
    }
}
</style>
