<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const props = defineProps<{
   connected: boolean
}>()

const { t } = useI18n()

const connectedRef = toRef(props, 'connected')

</script>

<template>
    <div>
        <VIcon v-if="connectedRef" icon="mdi-autorenew" />
        <VIcon v-else icon="mdi-autorenew-off" />
        <VTooltip activator="parent">{{ connected ? t('common.statusBar.autoRefresh.connected') : t('common.statusBar.autoRefresh.disconnected') }}</VTooltip>
    </div>
</template>

<style scoped lang="scss">

</style>
