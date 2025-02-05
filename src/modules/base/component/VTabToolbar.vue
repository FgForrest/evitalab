<script setup lang="ts">
/**
 * Common pre-configured toolbar for tab windows.
 */
import { computed } from 'vue'
import { List } from 'immutable'
import VTabToolbarTitle from '@/modules/base/component/VTabToolbarTitle.vue'

type Flag = {
    title: string,
    prependIcon?: string,
}

const props = withDefaults(defineProps<{
    prependIcon: string,
    title: List<string>,
    flags?: List<string>,
    extensionHeight?: string | number
}>(), {
    flags: () => List(),
    extensionHeight: undefined
})

const normalizedFlags = computed<List<Flag>>(() => {
    const normalizedFlags: List<Flag> = props.flags.map((flag: any) => {
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
        :extension-height="extensionHeight"
        class="tab-toolbar bg-primary-light"
    >
        <VAppBarNavIcon
            :icon="prependIcon"
            :disabled="true"
            style="opacity: 1"
            class="ml-0"
        />

        <VToolbarTitle class="ml-0 font-weight-bold">
            <div class="tab-toolbar__title">
                <VTabToolbarTitle :title="title" />

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
        <template v-if="$slots['extension']" #extension>
            <slot name="extension"/>
        </template>
    </VToolbar>
</template>

<style lang="scss" scoped>
.tab-toolbar {
    z-index: 100;

    &__title {
        display: flex;
        column-gap: 1rem;
        align-items: center;
    }
}
</style>
