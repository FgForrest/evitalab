<script setup lang="ts">
/**
 * VCardTitle component with close button
 */

const emit = defineEmits<{
    (e: 'close'): void
}>()
</script>

<template>
    <VCardTitle>
        <div class="title-container">
            <span>
                <slot />
            </span>
            <VBtn
                icon
                variant="flat"
                density="compact"
                @click="emit('close')"
            >
                <VIcon>mdi-close</VIcon>
            </VBtn>
        </div>
    </VCardTitle>
</template>

<style lang="scss" scoped>
.title-container {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
}
</style>
