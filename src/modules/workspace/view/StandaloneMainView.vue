<script lang="ts" setup>

/**
 * Bootstraps the workspace for standalone run mode
 */

import { ref } from 'vue'
import WorkspacePanel from '@/modules/workspace/panel/component/WorkspacePanel.vue'
import ConnectionExplorerPanel from '@/modules/connection-explorer/component/ConnectionExplorerPanel.vue'
import WorkspaceTabWindowList from '@/modules/workspace/tab/component/WorkspaceTabWindowList.vue'
import WorkspaceStatusBar from '@/modules/workspace/status-bar/component/WorkspaceStatusBar.vue'

const showExplorerPanel = ref<boolean>(true)

</script>

<template>
    <WorkspacePanel v-model:show-panel="showExplorerPanel"/>
    <WorkspaceStatusBar />
    <ConnectionExplorerPanel :model-value="showExplorerPanel"/>
    <WorkspaceTabWindowList />
</template>
