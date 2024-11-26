<script setup lang="ts">
import Immutable from 'immutable'

const props = defineProps<{
    title: Immutable.List<string>
}>()
</script>

<template>
    <div class="tab-toolbar-title">
        <template v-for="(item, index) in title" :key="index">
            <span
                v-if="index < title.size - 1"
                class="text-subtitle-1 text-disabled"
            >
                {{ item }}
            </span>
            <span v-else>
                {{ item }}
            </span>

            <VIcon
                v-if="(index + 1) < title.size"
                icon="mdi-chevron-right"
                size="16"
                class="mx-1"
            />
        </template>
    </div>
</template>

<style lang="scss" scoped>
.tab-toolbar-title {
    display: flex;
    align-items: center;
}
</style>
