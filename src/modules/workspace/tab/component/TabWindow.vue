<script setup lang="ts">
import { ref, watch } from 'vue'
import { TabData } from '@/modules/workspace/tab/model/TabData'
import TabLoadingScreen from '@/modules/workspace/tab/component/TabLoadingScreen.vue'
import { TabComponentProps } from '@/modules/workspace/tab/model/TabComponentProps'
import { SubjectPath } from '@/modules/workspace/status-bar/model/subject-path-status/SubjectPath'
import { useWorkspaceService, WorkspaceService } from '@/modules/workspace/service/WorkspaceService'

const workspaceService: WorkspaceService = useWorkspaceService()

const props = defineProps<{
    id: string,
    component: any,
    componentProps: TabComponentProps<any, any>
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

function handleDataUpdated(data: TabData<any>): void {
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
