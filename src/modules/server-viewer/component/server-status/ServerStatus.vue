<script setup lang="ts">

import { ServerStatus } from '@/modules/connection/model/status/ServerStatus'
import { Connection } from '@/modules/connection/model/Connection'
import { useI18n } from 'vue-i18n'
import { ref } from 'vue'
import OpenRuntimeConfigurationButton
    from '@/modules/server-viewer/component/server-status/OpenRuntimeConfigurationButton.vue'
import Tile from '@/modules/server-viewer/component/server-status/Tile.vue'
import ApiInfoList from '@/modules/server-viewer/component/server-status/ApiInfoList.vue'
import Stats from '@/modules/server-viewer/component/server-status/Stats.vue'

const { t } = useI18n()

const props = defineProps<{
    connection: Connection,
    serverStatus: ServerStatus
}>()

const runtimeConfigurationRef = ref<typeof OpenRuntimeConfigurationButton>()

defineExpose<{
    reload(): Promise<void>
}>({
    reload: () => runtimeConfigurationRef.value?.reload()
})
</script>

<template>
    <VCard variant="tonal">
        <VCardTitle class="mt-4 ml-2">
            {{ t('serverViewer.serverStatus.title') }}
        </VCardTitle>

        <VCardText>
            <div class="status-detail">
                <Tile prepend-icon="mdi-chart-bell-curve-cumulative">
                    <Stats :server-status="serverStatus" />
                </Tile>

                <Tile prepend-icon="mdi-api">
                    <ApiInfoList :apis="serverStatus.apis" />
                </Tile>

                <Tile prepend-icon="mdi-cog-outline">
                    <OpenRuntimeConfigurationButton
                        ref="runtimeConfigurationRef"
                        :connection="connection"
                        :server-status="serverStatus"
                    />
                </Tile>
            </div>
        </VCardText>
    </VCard>
</template>

<style lang="scss" scoped>
.status-detail {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: min-content min-content;
    gap: 1rem;
    max-width: 60rem;
    margin-top: 0.5rem;
}
</style>
