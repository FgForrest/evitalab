<script lang="ts" setup>

/**
 * Bootstraps the workspace for driver run mode
 */

import WorkspaceTabWindowList from '@/modules/workspace/tab/component/WorkspaceTabWindowList.vue'
import WorkspaceStatusBar from '@/modules/workspace/status-bar/component/WorkspaceStatusBar.vue'
import ConnectionExplorerPanel from '@/modules/connection-explorer/component/ConnectionExplorerPanel.vue'

</script>

<template>
    <WorkspaceStatusBar />
    <ConnectionExplorerPanel />
    <WorkspaceTabWindowList />
</template>
