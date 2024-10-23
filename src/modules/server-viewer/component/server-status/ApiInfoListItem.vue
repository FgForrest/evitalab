<script setup lang="ts">

import { ApiType } from '@/modules/connection/model/status/ApiType'
import { ApiStatus } from '@/modules/connection/model/status/ApiStatus'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import OpenApiDetailButton from '@/modules/server-viewer/component/server-status/OpenApiDetailButton.vue'

const { t } = useI18n()

const props = defineProps<{
    apiType: ApiType,
    apiStatus: ApiStatus
}>()

const badgeColor = computed<string>(() => {
    if (!props.apiStatus.enabled) {
        return 'grey'
    }
    if (!props.apiStatus.ready) {
        return 'error'
    }
    return 'success'
})
const badgeTooltip = computed<string>(() => {
    if (!props.apiStatus.enabled) {
        return t('serverViewer.serverStatus.apiState.disabled')
    }
    if (!props.apiStatus.ready) {
        return t('serverViewer.serverStatus.apiState.notReady')
    }
    return t('serverViewer.serverStatus.apiState.ready')
})
</script>

<template>
    <div class="api-info-list-item">
        <VBadge :color="badgeColor" inline class="api-info-list-item__state">
            <VTooltip activator="parent">
                {{ badgeTooltip }}
            </VTooltip>
        </VBadge>

        <span>{{ t(`serverViewer.serverStatus.apiType.${apiType}`) }}</span>

        <OpenApiDetailButton
            :api-type="apiType"
            :api-status="apiStatus"
        />
    </div>
</template>

<style lang="scss" scoped>
.api-info-list-item {
    display: inline-grid;
    grid-template-columns: 1.75rem min-content 1.5rem;
    column-gap: 0.5rem;
    align-items: center;

    &__state {
        margin: 0.125rem 0;
    }

    &__content {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    &__urls {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
    }
}
</style>
