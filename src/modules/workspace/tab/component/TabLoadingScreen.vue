<script setup lang="ts">
/**
 * Generic loading screen to display while a tab component is being initialized.
 */

import { useI18n } from 'vue-i18n'
import VLoadingCircular from '@/modules/base/component/VLoadingCircular.vue'

const { t } = useI18n()
</script>

<template>
    <div class="loading-screen">
        <div class="loading-screen-info">
            <VLoadingCircular :size="48" />
            <span>{{ t('tab.placeholder.loading') }}</span>
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
