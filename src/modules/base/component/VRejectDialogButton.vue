<script setup lang="ts">
/**
 * Custom button for canceling/rejecting dialogs
 */

const emit = defineEmits<{
    (e: 'reject'): void
}>()
</script>

<template>
    <VBtn
        variant="tonal"
        @click="emit('reject')"
    >
        <slot />
    </VBtn>
</template>

<style lang="scss" scoped>

</style>
