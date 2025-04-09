<script setup lang="ts">

import { computed } from 'vue'
import { EvitaLabConfig, useEvitaLabConfig } from '@/modules/config/EvitaLabConfig'
import { LabRunMode } from '@/LabRunMode'
import StandaloneWelcomeContent from '@/modules/welcome-screen/component/StandaloneWelcomeContent.vue'
import DriverWelcomeContent from '@/modules/welcome-screen/component/DriverWelcomeContent.vue'

const evitaLabConfig: EvitaLabConfig = useEvitaLabConfig()

const version = computed(() => {
    const actualVersion: string = import.meta.env.VITE_BUILD_VERSION
    if (actualVersion == undefined || actualVersion.length === 0) {
        return '?'
    }
    return actualVersion.substring(1) // remove v prefix
})

</script>

<template>
    <StandaloneWelcomeContent v-if="evitaLabConfig.runMode === LabRunMode.Standalone" :version="version" />
    <DriverWelcomeContent v-else-if="evitaLabConfig.runMode === LabRunMode.Driver" :version="version" />
</template>

<style lang="scss" scoped>

</style>
