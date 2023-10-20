<script setup lang="ts">
const props = withDefaults(defineProps<{
    actions?: any[]
    fillSpace?: boolean
}>(), {
    actions: () => [],
    fillSpace: true
})
const emit = defineEmits<{
    (e: 'click:action', value: any): void
}>()
</script>

<template>
    <VSheet
        :class="['value-renderer', { 'value-renderer--fill-space': fillSpace }, { 'value-renderer--with-actions': actions && actions.length > 0 }]"
        elevation="0"
    >
        <div class="value-renderer__body">
            <slot />
        </div>

        <VDivider
            v-if="actions"
            vertical
        />
        <VSheet
            v-if="actions"
            class="value-renderer__actions"
            elevation="0"
        >
            <VBtn
                v-for="action in actions"
                :key="action.value"
                icon
                variant="flat"
                @click="emit('click:action', action.value)"
            >
                <VIcon>{{ action.props.prependIcon }}</VIcon>
                <VTooltip activator="parent">
                    {{ action.title }}
                </VTooltip>
            </VBtn>
        </VSheet>
    </VSheet>
</template>

<style lang="scss" scoped>
.value-renderer {
    min-height: 15rem;
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: 1fr;
    height: 100%;

    &--with-actions {
        grid-template-columns: 1fr auto 3rem;
    }

    &--fill-space {
        min-height: 0;
    }

    &__body {
        position: relative;
    }

    &__actions {
        width: 3rem;
    }
}
</style>
