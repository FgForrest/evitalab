<script setup lang="ts">
/**
 * Common pre-configured toolbar for tab windows.
 */
import { computed } from 'vue'

type Flag = {
    title: string,
    prependIcon?: string,
}

const props = withDefaults(defineProps<{
    prependIcon: string,
    path: string[],
    flags?: any[]
}>(), {
    flags: () => []
})

const normalizedFlags = computed<Flag[]>(() => {
    const normalizedFlags: Flag[] = props.flags.map((flag: any) => {
        if (typeof flag === 'string') {
            return {
                title: flag,
            }
        } else {
            return flag as Flag
        }
    })
    return normalizedFlags
})
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
            <div style="display: flex">
                <VBreadcrumbs
                    :items="path"
                    class="pl-0 pr-0 pt-0 pb-0 mr-4"
                />

                <VChipGroup v-if="normalizedFlags">
                    <VChip
                        v-for="flag in normalizedFlags"
                        :key="flag.title"
                        :prepend-icon="flag.prependIcon as any"
                    >
                        {{ flag.title }}
                    </VChip>
                </VChipGroup>
            </div>
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
