<script setup lang="ts">
/**
 * Allows pagination in form of a "show more" button for expansion panels.
 */

import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps<{
    items: any[],
    page: number,
    pageSize: number
}>()
const emit = defineEmits<{
    (e: 'update:page', page: number): void
}>()

const lastPage = computed<number>(() => {
    return Math.ceil(props.items.length / props.pageSize)
})
const pageOfItems = computed<any[]>(() => {
    return props.items.slice(0, props.page * props.pageSize)
})
</script>

<template>
    <template v-for="(item, index) in pageOfItems" :key="index">
        <slot name="item" :item="item" :index="index" />
    </template>
    <div class="pt-2">
        <VBtn
            v-if="lastPage > 1 && page < lastPage"
            variant="outlined"
            @click="emit('update:page', page + 1)"
        >
            {{ t('common.button.showMore') }}
        </VBtn>
    </div>
</template>

<style lang="scss" scoped>

</style>
