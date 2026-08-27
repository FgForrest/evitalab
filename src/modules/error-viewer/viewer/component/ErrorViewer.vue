<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { TabComponentProps } from '@/modules/workspace/tab/model/TabComponentProps'
import { VoidTabData } from '@/modules/workspace/tab/model/void/VoidTabData'
import type { TabComponentEvents } from '@/modules/workspace/tab/model/TabComponentEvents'
import { ErrorViewerTabParams } from '@/modules/error-viewer/viewer/workspace/model/ErrorViewerTabParams'
import VTabToolbar from '@/modules/base/component/VTabToolbar.vue'
import VPreviewEditor from '@/modules/code-editor/component/VPreviewEditor.vue'
import { List as ImmutableList } from 'immutable'
import type { TabComponentExpose } from '@/modules/workspace/tab/model/TabComponentExpose'
import { SubjectPath } from '@/modules/workspace/status-bar/model/subject-path-status/SubjectPath'
import { SystemSubjectPath } from '@/modules/workspace/status-bar/model/subject-path-status/SystemSubjectPath'
import { SubjectPathItem } from '@/modules/workspace/status-bar/model/subject-path-status/SubjectPathItem'
import { ErrorViewerTabDefinition } from '@/modules/error-viewer/viewer/workspace/model/ErrorViewerTabDefinition'
import ShareTabButton from '@/modules/workspace/tab/component/ShareTabButton.vue'
import { TabType } from '@/modules/workspace/tab/model/TabType'
import { Command } from '@/modules/keymap/model/Command'
import { Keymap, useKeymap } from '@/modules/keymap/service/Keymap'
import { onMounted, onUnmounted, ref } from 'vue'

const keymap: Keymap = useKeymap()
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

const title: ImmutableList<string> = ImmutableList.of(
    t('errorViewer.title', { name: props.params.error.name })
)

const shareTabButtonRef = ref<InstanceType<typeof ShareTabButton> | undefined>()

const detail = computed<string>(() => {
    if (props.params.error.detail == undefined) {
        return t('errorViewer.placeholder.noDetailsAvailable')
    }
    return props.params.error.detail
})

onMounted(() => {
    keymap.bind(Command.ErrorViewer_ShareTab, props.id, () => shareTabButtonRef.value?.share())
})
onUnmounted(() => {
    keymap.unbind(Command.ErrorViewer_ShareTab, props.id)
})

/**
 * Ceiling for the length of the prefilled issue URL. GitHub answers an over-long request line with
 * HTTP 414 and documents no exact limit, so the error detail is trimmed well below the commonly cited
 * 8 kB rather than risking a dead button.
 */
const maxIssueUrlLength: number = 6000

/**
 * Link to a new evitaDB issue prefilled with the error. Errors surfaced here originate from the server,
 * which is why the report goes to the evitaDB repository and not to evitaLab's own.
 *
 * Nothing is submitted by opening it - GitHub renders the prefilled form, so the user reviews the report
 * (and completes the description) before filing it.
 */
const submitIssueUrl = computed<string>(() => {
    const url: URL = new URL('https://github.com/FgForrest/evitaDB/issues/new')
    url.searchParams.set('title', t('errorViewer.issue.title', { name: props.params.error.name }))

    const version: string = import.meta.env.VITE_BUILD_VERSION || '?'
    const buildBody = (detail: string): string => t('errorViewer.issue.body', { detail, version })

    // the detail carries a whole stack trace and percent-encoding inflates it further, so it is shortened
    // until the encoded URL fits
    let includedDetail: string = props.params.error.detail ?? props.params.error.message
    let truncated: boolean = false
    for (;;) {
        url.searchParams.set('body', buildBody(truncated
            ? `${includedDetail}\n${t('errorViewer.issue.detailTruncated')}`
            : includedDetail))
        if (url.toString().length <= maxIssueUrlLength || includedDetail.length === 0) {
            break
        }
        includedDetail = includedDetail.substring(0, Math.floor(includedDetail.length * 0.9))
        truncated = true
    }

    return url.toString()
})

function submitIssue(): void {
    window.open(submitIssueUrl.value, '_blank')
}

emit('ready')
</script>

<template>
    <div class="error-viewer">
        <VTabToolbar
            :prepend-icon="ErrorViewerTabDefinition.icon()"
            :title="title"
        >
            <template #append>
                <ShareTabButton
                    ref="shareTabButtonRef"
                    :tab-type="TabType.ErrorViewer"
                    :tab-params="params"
                    :tab-data="undefined"
                    :command="Command.ErrorViewer_ShareTab"
                />

                <VBtn
                    icon
                    density="compact"
                    @click="submitIssue"
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
