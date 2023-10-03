<script setup lang="ts">
/**
 * Toolbar for the LabEditorDataGrid component.
 */

const props = defineProps<{
    path: string[]
    loading: boolean
}>()
const emit = defineEmits<{
    (e: 'executeQuery'): void
}>()

</script>

<template>
    <VToolbar
        density="compact"
        elevation="2"
        class="data-grid__header"
    >
        <VAppBarNavIcon
            icon="mdi-table"
            :disabled="true"
            style="opacity: 1"
        />

        <VToolbarTitle>
            <VBreadcrumbs
                :items="path"
                class="pl-0 pr-0"
            />
        </VToolbarTitle>

        <template #append>
            <VBtn
                icon
                variant="elevated"
                :loading="loading"
                density="compact"
                @click="emit('executeQuery')"
            >
                <VIcon>mdi-play</VIcon>

                <VTooltip activator="parent">
                    Execute query
                </VTooltip>
            </VBtn>
        </template>

        <template #extension>
            <slot name="query" />
        </template>
    </VToolbar>
</template>

<style lang="scss" scoped>
.data-grid__header {
    z-index: 100;
}
</style>
