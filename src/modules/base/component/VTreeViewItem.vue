<script setup lang="ts">
import { ref } from 'vue'
import VLoadingCircular from '@/modules/base/component/VLoadingCircular.vue'
import { MenuItem } from '@/modules/base/model/menu/MenuItem'
import { ItemFlag } from '@/modules/base/model/tree-view/ItemFlag'

export interface Props {
    openable?: boolean,
    isOpen?: boolean,
    prependIcon: string,
    loading?: boolean,
    flags?: ItemFlag[],
    actions?: MenuItem<any>[]
}

const props = withDefaults(defineProps<Props>(), {
    openable: false,
    isOpen: false,
    loading: false,
    flags: () => [],
    actions: () => []
})

const actionsOpened = ref<boolean>(false)

const emit = defineEmits<{
    (e: 'click:action', value: string): void
}>()

function openActions(): void {
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
                    <slot />

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
@import "@/styles/colors.scss";

.tree-view-item {
    &__content {
        width: 100%;
        min-height: 2rem;
        display: inline-grid;
        grid-template-columns: 1.5rem 1.5rem 1fr 1.5rem;
        column-gap: 0.5rem;
        align-items: center;
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
