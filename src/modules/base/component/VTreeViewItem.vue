<script setup lang="ts">
import { ref } from 'vue'
import VLoadingCircular from '@/modules/base/component/VLoadingCircular.vue'
import type { MenuItem } from '@/modules/base/model/menu/MenuItem'
import { ItemFlag } from '@/modules/base/model/tree-view/ItemFlag'

export interface Props {
    openable?: boolean,
    isOpen?: boolean,
    prependIcon: string,
    loading?: boolean,
    flags?: ItemFlag[],
    actions?: MenuItem<unknown>[],
    /**
     * Reserves expanding the item for its leading arrow, and reports the arrow click as `click:open` instead of
     * letting it reach the row. An item that does so gives the row click a meaning of its own — typically opening
     * the thing the row represents.
     */
    openableByArrowOnly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    openable: false,
    isOpen: false,
    loading: false,
    flags: () => [],
    actions: () => [],
    openableByArrowOnly: false
})

const actionsOpened = ref<boolean>(false)

const emit = defineEmits<{
    (e: 'click:action', value: string): void,
    (e: 'click:actionMenu'): void,
    (e: 'click:open', event: MouseEvent): void
}>()

function handleOpenClick(event: MouseEvent): void {
    if (!props.openableByArrowOnly) {
        // the row itself is the toggle - let the click bubble to it
        return
    }
    event.stopPropagation()
    emit('click:open', event)
}

function openActions(): void {
    emit('click:actionMenu')
    if (props.actions && props.actions.length > 0) {
        actionsOpened.value = true
    }
}
</script>

<template>
    <VListItem
        :prepend-icon="null as any"
        :append-icon="null as any"
        @contextmenu.prevent="openActions"
    >
        <div class="tree-view-item__content">
            <VIcon
                v-if="openable"
                :class="{ 'tree-view-item__open-icon--standalone': openableByArrowOnly }"
                @click="handleOpenClick"
            >
                {{ isOpen ? 'mdi-chevron-up' : 'mdi-chevron-down' }}
            </VIcon>
            <VIcon
                v-else
            >

            </VIcon>

            <VLoadingCircular v-if="loading" />
            <VIcon v-else>
                {{ prependIcon }}
            </VIcon>

            <VTooltip>
                <template #activator="{ props }">
                    <span v-bind="props" class="tree-view-item__text text-truncate">
                        <slot>
                            <span class="text-disabled">
                                No items found
                            </span>
                        </slot>

                        <span v-if="flags.length > 0" class="tree-view-item__flags">
                            <span
                                v-for="flag in flags"
                                :key="flag.value"
                                :class="['tree-view-item__flag', `tree-view-item__flag--${flag.type}`]"
                            >
                                {{ flag.value }}
                            </span>
                        </span>
                    </span>
                </template>

                <template #default>
                    <slot name="tooltip"></slot>
                    <!-- couldn't use VChips because custom colors didn't work on them -->
                    <span v-if="flags.length > 0" class="tree-view-item__flags">
                        <span
                            v-for="flag in flags"
                            :key="flag.value"
                            :class="['tree-view-item__flag', 'tree-view-item__lg-flag', `tree-view-item__flag--${flag.type}`]"
                        >
                            {{ flag.value }}
                        </span>
                    </span>
                </template>
            </VTooltip>

            <VMenu
                v-if="actions && actions.length > 0"
                :menu-items="actions"
                v-model="actionsOpened"
            >
                <template #activator="{ props }">
                    <VIcon
                        v-bind="props"
                        class="text-gray-light"
                        @click.stop="emit('click:actionMenu')"
                    >
                        mdi-dots-vertical
                    </VIcon>
                </template>

                <VList
                    density="compact"
                    :items="actions"
                    @click:select="$emit('click:action', $event.id as string)"
                >
                    <template #item="{ props }">
                        <VListItem
                            :prepend-icon="props.prependIcon"
                            :value="props.value"
                            :disabled="props.disabled"
                        >
                            {{ props.title }}
                        </VListItem>
                    </template>
                </VList>
            </VMenu>
        </div>
    </VListItem>
</template>

<style lang="scss" scoped>
@use "@/styles/colors.scss" as *;

.tree-view-item {
    &__content {
        width: 100%;
        min-height: 2rem;
        display: inline-grid;
        grid-template-columns: 1.5rem 1.5rem 1fr 1.5rem;
        column-gap: 0.5rem;
        align-items: center;
    }

    &__open-icon--standalone {
        // the arrow is the only way to expand such an item, so it advertises itself as separately clickable
        border-radius: 50%;

        &:hover {
            background-color: rgba(var(--v-theme-on-surface), 0.1);
        }
    }

    &__text {
        display: flex;
        flex-direction: column;
    }

    &__flags {
        margin-top: 0.25rem;
        margin-bottom: 0.25rem;
        display: flex;
        gap: 0.25rem;
    }

    &__flag {
        color: $gray-light;
        background-color: $gray-dark;
        border-radius: 9999px;
        font-weight: normal;
        font-size: 0.6rem;
        padding: 0 0.5rem;
        line-height: 1rem;
        height: min-content;

        &--warning {
            color: $warning;
            background-color: $warning-background;
        }

        &--error {
            color: $error;
            background-color: $error-background;
        }
    }

    &__lg-flag {
        font-size: 0.875rem;
        line-height: 1.5rem;
        padding: 0 0.75rem;
    }
}
</style>
