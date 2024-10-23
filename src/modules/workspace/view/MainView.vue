<script lang="ts" setup>

import { ref } from 'vue'
import { PanelType } from '@/modules/workspace/panel/model/PanelType'
import WorkspacePanel from '@/modules/workspace/panel/component/WorkspacePanel.vue'
import ConnectionExplorerPanel from '@/modules/connection/explorer/component/ConnectionExplorerPanel.vue'
import WorkspaceTabWindowList from '@/modules/workspace/tab/component/WorkspaceTabWindowList.vue'

const panel = ref<string>(PanelType.Explorer)

</script>

<template>
    <WorkspacePanel v-model:panel="panel"/>
    <ConnectionExplorerPanel :model-value="panel === PanelType.Explorer"/>

    <WorkspaceTabWindowList />
</template>
