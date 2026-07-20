<script setup lang="ts">
/**
 * Generic loading screen to display while a tab component is being initialized. When the tab reports an
 * initialization failure it switches to an error state offering a "Try again" action.
 */

import { useI18n } from 'vue-i18n'
import VLoadingCircular from '@/modules/base/component/VLoadingCircular.vue'

withDefaults(
    defineProps<{
        failed?: boolean,
        errorMessage?: string
    }>(),
    {
        failed: false,
        errorMessage: undefined
    }
)

const emit = defineEmits<{
    (e: 'retry'): void
}>()

const { t } = useI18n()
</script>

<template>
    <div class="loading-screen">
        <div class="loading-screen-info">
            <template v-if="failed">
                <VIcon :size="48" color="error">mdi-alert-circle-outline</VIcon>
                <span>{{ errorMessage ?? t('tab.placeholder.loadingFailed') }}</span>
                <VBtn variant="outlined" @click="emit('retry')">
                    {{ t('common.button.tryAgain') }}
                </VBtn>
            </template>
            <template v-else>
                <VLoadingCircular :size="48" />
                <span>{{ t('tab.placeholder.loading') }}</span>
            </template>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.loading-screen {
    display: grid;
    align-items: center;
    justify-items: center;
}

.loading-screen-info {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    align-items: center;
}
</style>
