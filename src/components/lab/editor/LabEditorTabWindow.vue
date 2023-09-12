<script setup lang="ts">
const props = defineProps<{
    component: any,
    componentProps: any
}>()
</script>

<template>
    <KeepAlive>
        <Component
            :is="component"
            v-bind="componentProps"
        />
    </KeepAlive>
</template>

<style lang="scss" scoped>

</style>
