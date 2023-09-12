<script setup lang="ts">
import { ref } from 'vue'

export interface Props {
    openable?: boolean,
    isOpen?: boolean,
    prependIcon: string,
    actions?: object[]
}

const props = withDefaults(defineProps<Props>(), {
    openable: false,
    isOpen: false,
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
        <div
            class="tree-view-item__content"
        >
            <VIcon
                v-if="openable"
            >
                {{ isOpen ? 'mdi-chevron-up' : 'mdi-chevron-down' }}
            </VIcon>
            <VIcon
                v-else
            >

            </VIcon>

            <VIcon>
                {{ prependIcon }}
            </VIcon>
            <span class="text-truncate">
                <slot />
            </span>
            <VMenu
                v-if="actions && actions.length > 0"
                :menu-items="actions"
                v-model="actionsOpened"
            >
                <template #activator="{ props }">
                    <VIcon
                        v-bind="props"
                    >
                        mdi-dots-vertical
                    </VIcon>
                </template>

                <VList
                    density="compact"
                    :items="actions"
                    @click:select="$emit('click:action', $event.id)"
                />
            </VMenu>
        </div>
    </VListItem>
</template>

<style lang="scss" scoped>
.tree-view-item {
    &__content {
        width: 100%;
        height: 2rem;
        display: inline-grid;
        grid-template-columns: 1.5rem 1.5rem 1fr 1.5rem;
        column-gap: 0.5rem;
        align-items: center;
    }
}
</style>
