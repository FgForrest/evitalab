<script setup lang="ts">
/**
 * Dialog window to accept or reject a shared tab.
 */

import { EditorService, useEditorService } from '@/services/editor/editor.service'
import { TabRequest } from '@/model/editor/tab/TabRequest'

const editorService: EditorService = useEditorService()

const props = defineProps<{
    tabRequest: TabRequest<any, any>
}>()
const emit = defineEmits<{
    (e: 'resolve'): void
}>()

function acceptSharedTab(): void {
    editorService.createTab(props.tabRequest)
    emit('resolve')
}

function rejectSharedTab(): void {
    emit('resolve')
}
</script>

<template>
    <VDialog
        :model-value="true"
        max-width="36rem"
        @update:model-value="rejectSharedTab"
    >
        <VCard class="py-8 px-4">
            <VCardTitle>Shared tab found</VCardTitle>

            <VCardText>
                <template v-if="tabRequest.initialData != undefined">
                    The URL contains an embedded query from an unknown source. Do you want to open it? If you accept,
                    evitaLab will <em>open a new tab</em> with the query, but will <em>not</em> execute it automatically.
                    You can still decide if you want to execute it. If you reject, the query in the URL will be <em>discarded</em>.
                </template>
                <template v-else>
                    The URL contains an embedded shared tab from an unknown source. Do you want to open it? If you accept
                    it, evitaLab will <em>open a new tab</em> with the query. If you reject it, it will be <em>discarded</em>.
                </template>
            </VCardText>
            <VCardText v-if="tabRequest.initialData != undefined">
                <VAlert
                    icon="mdi-alert-outline"
                    type="warning"
                >
                    <em>Be careful!</em> The query in the URL may contain potentially malicious code.
                </VAlert>
            </VCardText>

            <VCardActions class="px-6">
                <VSpacer/>
                <VBtn
                    variant="tonal"
                    @click="rejectSharedTab">
                    Reject
                </VBtn>
                <VBtn
                    variant="outlined"
                    prepend-icon="mdi-check"
                    @click="acceptSharedTab"
                    class="ml-4"
                >
                    Accept
                </VBtn>
            </VCardActions>
        </VCard>
    </VDialog>
</template>

<style lang="scss" scoped>

</style>
