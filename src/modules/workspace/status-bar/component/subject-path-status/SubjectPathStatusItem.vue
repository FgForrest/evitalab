<script setup lang="ts">
import { SubjectPathItem } from '@/modules/workspace/status-bar/model/subject-path-status/SubjectPathItem'

const props = defineProps<{
    item: SubjectPathItem
}>()

function handleClick(): void {
    if (props.item.onClick != undefined) {
        props.item.onClick()
    }
}
</script>

<template>
    <div
        :class="['subject-path-status-item', {'subject-path-status-item--clickable': item.onClick != undefined}]"
        @click="handleClick"
    >
        <VIcon v-if="item.icon" :icon="item.icon" size="12" />
        <span>{{ item.value }}</span>
    </div>
</template>

<style lang="scss" scoped>
@import "@/styles/colors.scss";

.subject-path-status-item {
    display: flex;
    column-gap: 0.25rem;
    align-items: center;
    padding: 0 0.25rem;

    &--clickable {
        border-radius: 1rem;
        transition: all .2s linear;
        cursor: pointer;
        outline: 0.0625rem solid transparent;
        outline-offset: 0.0625rem;

        &:hover {
            outline: 0.0625rem solid $gray-light;
        }
    }
}
</style>
