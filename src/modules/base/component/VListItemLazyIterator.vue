<script setup lang="ts" generic="T">
/**
 * Allows pagination in form of a "show more" button for lists.
 */

import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { List } from 'immutable'

const { t } = useI18n()

const props = defineProps<{
    items: List<T>,
    page: number,
    pageSize: number
}>()
const emit = defineEmits<{
    (e: 'update:page', page: number): void
}>()

const lastPage = computed<number>(() => {
    return Math.ceil(props.items.size / props.pageSize)
})
const pageOfItems = computed<List<T>>(() => {
    return props.items.slice(0, props.page * props.pageSize)
})
</script>

<template>
    <template v-for="(item, index) in pageOfItems" :key="index">
        <slot name="item" :item="item" :index="index" />
    </template>
    <VListItem v-if="lastPage > 1 && page < lastPage">
        <VBtn @click="emit('update:page', page + 1)">
            {{ t('common.button.showMore') }}
        </VBtn>
    </VListItem>
</template>

<style lang="scss" scoped>

</style>
