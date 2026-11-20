<script setup lang="ts">

import { useI18n } from 'vue-i18n'
import VTabMainActionButton from '@/modules/base/component/VTabMainActionButton.vue'
import VActionTooltip from '@/modules/base/component/VActionTooltip.vue'
import { Command } from '@/modules/keymap/model/Command.ts'
import type { ExecuteQueryVariant } from '@/modules/base/model/ExecuteQueryVariant'

const { t } = useI18n()

/**
 * Pre-defined button to execute queries. When `variants` are passed, the button turns into a split button: the
 * primary run action stays in place and an attached chevron opens a menu of alternative ways to execute the query.
 */
withDefaults(defineProps<{
    loading?: boolean,
    command: Command,
    title: string,
    variants?: ExecuteQueryVariant[]
}>(), {
    loading: false,
    variants: undefined
})
const emit = defineEmits<{
    (e: 'click'): void
    (e: 'variant', command: Command): void
}>()
</script>

<template>
    <VTabMainActionButton
        v-if="variants == undefined || variants.length === 0"
        :loading="loading"
        prepend-icon="mdi-play-outline"
        @click="emit('click')"
    >
        <VActionTooltip :command="command">
            {{ t('common.button.executeQuery') }}
        </VActionTooltip>

        {{ title }}
    </VTabMainActionButton>

    <div v-else class="execute-query-split-button">
        <VTabMainActionButton
            :loading="loading"
            prepend-icon="mdi-play-outline"
            class="execute-query-split-button__primary"
            @click="emit('click')"
        >
            <VActionTooltip :command="command">
                {{ t('common.button.executeQuery') }}
            </VActionTooltip>

            {{ title }}
        </VTabMainActionButton>

        <VMenu location="bottom end">
            <template #activator="{ props: menuProps }">
                <VBtn
                    v-bind="menuProps"
                    icon
                    density="compact"
                    :disabled="loading"
                    class="v-btn--variant-primary execute-query-split-button__variants"
                >
                    <VIcon>mdi-chevron-down</VIcon>
                    <VTooltip activator="parent">
                        {{ t('common.button.moreRunOptions') }}
                    </VTooltip>
                </VBtn>
            </template>

            <VList density="compact">
                <!-- the wrapper is the tooltip activator: inside the item, `activator="parent"` would bind to the
                     item's content box only, and the tooltip would not show over the item's padding and icon -->
                <div
                    v-for="variant in variants"
                    :key="variant.command"
                    class="execute-query-split-button__variant"
                >
                    <VListItem
                        prepend-icon="mdi-play-outline"
                        :title="variant.title"
                        @click="emit('variant', variant.command)"
                    />
                    <VActionTooltip :command="variant.command">
                        {{ variant.title }}
                    </VActionTooltip>
                </div>
            </VList>
        </VMenu>
    </div>
</template>

<style lang="scss" scoped>
.execute-query-split-button {
    display: flex;
    align-items: center;

    &__primary {
        border-top-right-radius: 0;
        border-bottom-right-radius: 0;
    }

    // overrides the padding of the primary variant, which is meant for text buttons
    &__variants.v-btn {
        margin-left: -1px;
        padding: 0 !important;
        width: 30px;
        border-top-left-radius: 0;
        border-bottom-left-radius: 0;
    }
}
</style>
