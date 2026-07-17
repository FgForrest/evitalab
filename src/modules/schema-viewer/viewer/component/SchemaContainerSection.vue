<script setup lang="ts">
defineProps<{
    name: string,
    loading?: boolean,
}>()
</script>

<template>
    <VExpansionPanel>
        <VExpansionPanelTitle>
            <VProgressCircular v-if="loading" indeterminate size="22.5" />
            <span :class="loading ? 'content-title' : ''">{{ name }}</span>
        </VExpansionPanelTitle>

        <VExpansionPanelText>
            <slot />
        </VExpansionPanelText>
    </VExpansionPanel>
</template>

<style lang="scss" scoped>
.content-title{
    margin-left: 10px;
}
</style>
