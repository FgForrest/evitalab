<script setup lang="ts">
import { ref, watch } from 'vue'
import type { AnyTabData } from '@/modules/workspace/tab/model/TabData'
import TabLoadingScreen from '@/modules/workspace/tab/component/TabLoadingScreen.vue'
import type { Component } from 'vue'
import type { TabComponentProps } from '@/modules/workspace/tab/model/TabComponentProps'
import type { AnyTabParams } from '@/modules/workspace/tab/model/TabParams'
import { SubjectPath } from '@/modules/workspace/status-bar/model/subject-path-status/SubjectPath'
import { useWorkspaceService, WorkspaceService } from '@/modules/workspace/service/WorkspaceService'

const workspaceService: WorkspaceService = useWorkspaceService()

const props = defineProps<{
    id: string,
    component: Component,
    componentProps: TabComponentProps<AnyTabParams, AnyTabData>
}>()

const componentReady = ref<boolean>(false)
const componentFailed = ref<boolean>(false)
const componentErrorMessage = ref<string | undefined>()
// bumped to force a remount of the tab component when it does not expose a retry() method
const componentKey = ref<number>(0)
const componentInstance = ref()
watch(componentInstance, () => {
    updateComponentPath()
})

function handleReady(): void {
    componentReady.value = true
    componentFailed.value = false
    componentErrorMessage.value = undefined
    updateComponentPath()
}

function handleError(error?: Error): void {
    componentReady.value = false
    componentFailed.value = true
    componentErrorMessage.value = error?.message
}

function handleRetry(): void {
    componentReady.value = false
    componentFailed.value = false
    componentErrorMessage.value = undefined

    const retry: (() => void) | undefined = componentInstance.value?.retry
    if (retry != undefined) {
        retry()
    } else {
        // the component doesn't support in-place retry, so remount it to re-run its initialization
        componentKey.value++
    }
}

function handleDataUpdated(data: AnyTabData): void {
    workspaceService.replaceTabData(props.id, data)
    updateComponentPath()
}

function updateComponentPath(): void {
    if (componentReady.value &&
        componentInstance.value != undefined &&
        componentInstance.value.path != undefined) {
        const path: SubjectPath | undefined = componentInstance.value.path()
        if (path != undefined) {
            workspaceService.subjectPathStatus.definePath(props.id, path)
        }
    }
}
</script>

<template>
    <KeepAlive>
        <Component
            :key="componentKey"
            ref="componentInstance"
            v-show="componentReady"
            :is="component"
            v-bind="componentProps"
            @ready="handleReady"
            @error="handleError"
            @update:data="handleDataUpdated"
        />
    </KeepAlive>
    <TabLoadingScreen
        v-if="!componentReady"
        :failed="componentFailed"
        :error-message="componentErrorMessage"
        @retry="handleRetry"
    />
</template>

<style lang="scss" scoped>

</style>
