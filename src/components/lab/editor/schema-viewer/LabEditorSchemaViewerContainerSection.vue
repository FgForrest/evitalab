<script setup lang="ts">
const props = defineProps<{
    name: string
}>()
</script>

<template>
    <VExpansionPanel>
        <VExpansionPanelTitle>
            {{ name }}
        </VExpansionPanelTitle>

        <VExpansionPanelText>
            <slot />
        </VExpansionPanelText>
    </VExpansionPanel>
</template>

<style lang="scss" scoped>

</style>
