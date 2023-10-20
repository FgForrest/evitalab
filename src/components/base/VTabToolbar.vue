<script setup lang="ts">
/**
 * Common pre-configured toolbar for tab windows.
 */

const props = defineProps<{
    prependIcon: string,
    path: string[]
}>()
</script>

<template>
    <VToolbar
        density="compact"
        elevation="2"
        class="tab-toolbar bg-primary-light"
    >
        <VAppBarNavIcon
            :icon="prependIcon"
            :disabled="true"
            style="opacity: 1"
            class="ml-0"
        />

        <VToolbarTitle class="ml-0 font-weight-bold">
            <VBreadcrumbs
                :items="path"
                class="pl-0 pr-0 pt-0 pb-0"
            />
        </VToolbarTitle>

        <template #append>
            <slot name="append"/>
        </template>

        <template #extension>
            <slot name="extension"/>
        </template>
    </VToolbar>
</template>

<style lang="scss" scoped>
.tab-toolbar {
    z-index: 100;
}
</style>
