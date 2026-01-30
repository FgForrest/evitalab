<script setup lang="ts">
import { ref, watch, type Component } from 'vue'
import type { TabData } from '@/modules/workspace/tab/model/TabData'
import type { TabDataDto } from '@/modules/workspace/tab/model/TabDataDto'
import type { TabParams } from '@/modules/workspace/tab/model/TabParams'
import type { TabParamsDto } from '@/modules/workspace/tab/model/TabParamsDto'
import TabLoadingScreen from '@/modules/workspace/tab/component/TabLoadingScreen.vue'
import type { TabComponentProps } from '@/modules/workspace/tab/model/TabComponentProps'
import { SubjectPath } from '@/modules/workspace/status-bar/model/subject-path-status/SubjectPath'
import { useWorkspaceService, WorkspaceService } from '@/modules/workspace/service/WorkspaceService'

const workspaceService: WorkspaceService = useWorkspaceService()

const props = defineProps<{
    id: string,
    component: Component,
    componentProps: TabComponentProps<TabParams<TabParamsDto>, TabData<TabDataDto>>
}>()

const componentReady = ref<boolean>(false)
const componentInstance = ref()
watch(componentInstance, () => {
    updateComponentPath()
})

function handleReady(): void {
    componentReady.value = true
    updateComponentPath()
}

function handleDataUpdated(data: TabData<TabDataDto>): void {
    workspaceService.replaceTabData(props.id, data)
    updateComponentPath()
}

function updateComponentPath(): void {
    if (componentReady.value &&
        componentInstance.value != undefined &&
        'path' in (componentInstance.value as Record<string, unknown>) &&
        typeof (componentInstance.value as Record<string, unknown>).path === 'function') {
        const path: SubjectPath | undefined = (componentInstance.value as { path: () => SubjectPath | undefined }).path()
        if (path != undefined) {
            workspaceService.subjectPathStatus.definePath(props.id, path)
        }
    }
}
</script>

<template>
    <KeepAlive>
        <Component
            ref="componentInstance"
            v-show="componentReady"
            :is="component"
            v-bind="componentProps"
            @ready="handleReady"
            @update:data="handleDataUpdated"
        />
    </KeepAlive>
    <TabLoadingScreen v-if="!componentReady" />
</template>

<style lang="scss" scoped>

</style>
