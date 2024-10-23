<script setup lang="ts">
/**
 * Custom button for alternative action button in dialogs
 */
const props = defineProps<{
    icon: string
}>()
const emit = defineEmits<{
    (e: 'click'): void
}>()
</script>

<template>
    <VBtn
        variant="plain"
        :prepend-icon="icon"
        @click="emit('click')"
    >
        <slot />
    </VBtn>
</template>

<style lang="scss" scoped>

</style>
