<script setup lang="ts">
/**
 * Generic loading screen to display while a tab component is being initialized.
 */

import VLoadingIcon from '@/components/base/VLoadingIcon.vue'
</script>

<template>
    <div class="loading-screen">
        <div class="loading-screen-info">
            <VLoadingIcon width="3rem" height="3rem"/>
            <span>Loading, please wait ...</span>
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
