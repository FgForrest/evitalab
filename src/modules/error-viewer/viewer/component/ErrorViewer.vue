<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { TabComponentProps } from '@/modules/workspace/tab/model/TabComponentProps'
import { VoidTabData } from '@/modules/workspace/tab/model/void/VoidTabData'
import { TabComponentEvents } from '@/modules/workspace/tab/model/TabComponentEvents'
import { ErrorViewerTabParams } from '@/modules/error-viewer/viewer/workspace/model/ErrorViewerTabParams'
import VTabToolbar from '@/modules/base/component/VTabToolbar.vue'
import VPreviewEditor from '@/modules/code-editor/component/VPreviewEditor.vue'
import Immutable from 'immutable'
import { TabComponentExpose } from '@/modules/workspace/tab/model/TabComponentExpose'
import { SubjectPath } from '@/modules/workspace/status-bar/model/subject-path-status/SubjectPath'
import { SystemSubjectPath } from '@/modules/workspace/status-bar/model/subject-path-status/SystemSubjectPath'
import { SubjectPathItem } from '@/modules/workspace/status-bar/model/subject-path-status/SubjectPathItem'
import { ErrorViewerTabDefinition } from '@/modules/error-viewer/viewer/workspace/model/ErrorViewerTabDefinition'

const { t } = useI18n()

const props = defineProps<TabComponentProps<ErrorViewerTabParams, VoidTabData>>()
const emit = defineEmits<TabComponentEvents>()
defineExpose<TabComponentExpose>({
    path(): SubjectPath | undefined {
        return new SystemSubjectPath([
            SubjectPathItem.significant(
                ErrorViewerTabDefinition.icon(),
                t('errorViewer.title', { name: props.params.error.name }
            ))
        ])
    }
})

const title: Immutable.List<string> = Immutable.List.of(
    t('errorViewer.title', { name: props.params.error.name })
)

const detail = computed(() => {
    if (props.params.error.detail == undefined) {
        return t('errorViewer.placeholder.noDetailsAvailable')
    }
    return props.params.error.detail
})

emit('ready')
</script>

<template>
    <div class="error-viewer">
        <VTabToolbar
            :prepend-icon="ErrorViewerTabDefinition.icon()"
            :title="title"
        >
            <!-- todo lho link to submit an issue to github -->
            <template #append>
                <VBtn
                    icon
                    density="compact"
                >
                    <VIcon>mdi-bug</VIcon>
                    <VTooltip activator="parent">
                        {{ t('errorViewer.button.submitIssue') }}
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
