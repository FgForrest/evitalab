<script lang="ts" setup>

/**
 * Bootstraps the workspace for standalone run mode
 */

import { ref } from 'vue'
import { PanelType } from '@/modules/workspace/panel/model/PanelType'
import WorkspacePanel from '@/modules/workspace/panel/component/WorkspacePanel.vue'
import ConnectionExplorerPanel from '@/modules/connection/explorer/component/ConnectionExplorerPanel.vue'
import WorkspaceTabWindowList from '@/modules/workspace/tab/component/WorkspaceTabWindowList.vue'
import WorkspaceStatusBar from '@/modules/workspace/status-bar/component/WorkspaceStatusBar.vue'
const panel = ref<string>(PanelType.Explorer)

</script>

<template>
    <WorkspaceStatusBar />
    <WorkspacePanel v-model:panel="panel"/>
    <ConnectionExplorerPanel :model-value="panel === PanelType.Explorer"/>
    <WorkspaceTabWindowList />
</template>
