<script setup lang="ts">

/*
    Global status bar for entire workspace. Individual components can
    display info via workspace API.
 */

import { useWorkspaceService, WorkspaceService } from '@/modules/workspace/service/WorkspaceService'
import { computed } from 'vue'
import EditorStatusComponent from '@/modules/workspace/status-bar/component/EditorStatus.vue'
import SubjectPathStatusComponent from '@/modules/workspace/status-bar/component/subject-path-status/SubjectPathStatus.vue'
import { SubjectPathStatus } from '@/modules/workspace/status-bar/model/subject-path-status/SubjectPathStatus'
import { EditorStatus } from '@/modules/workspace/status-bar/model/editor-status/EditorStatus'

const workspaceService: WorkspaceService = useWorkspaceService()

const pathStatus = computed<SubjectPathStatus>(() =>
    workspaceService.subjectPathStatus)
const editorStatus = computed<EditorStatus>(() =>
    workspaceService.editorStatus)
</script>

<template>
    <VAppBar
        height="28"
        location="bottom"
        flat
        class="bg-primary-dark status-bar"
    >
        <div class="left-content">
            <SubjectPathStatusComponent :status="pathStatus" />
        </div>
        <div class="right-content">
            <EditorStatusComponent :status="editorStatus" />
        </div>
    </VAppBar>
</template>

<style lang="scss" scoped>
.status-bar :deep(.v-toolbar__content) {
    position: relative;
    display: flex;
    justify-content: space-between;
    align-items: center;
    column-gap: 1rem;
    padding: 0 0.75rem;
    font-size: 0.75rem;
    border-top: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.left-content, .right-content {
    display: flex;
    column-gap: 1rem;
}

.left-content {
    justify-content: left;
}

.right-content {
    justify-content: right;
}
</style>
