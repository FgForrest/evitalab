<script setup lang="ts">
/**
 * Allows pagination in form of a "show more" button for lists.
 */

import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { List } from 'immutable'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'

const { t } = useI18n()

// todo lho try to get rid of array support
const props = defineProps<{
    items: any[] | List<any>,
    page: number,
    pageSize: number
}>()
const emit = defineEmits<{
    (e: 'update:page', page: number): void
}>()

const itemsSize = computed(() => {
    if (props.items instanceof Array) {
        return props.items.length
    } else if (props.items instanceof List) {
        return props.items.size
    } else {
        throw new UnexpectedError('Expected array or list of items')
    }
})

const lastPage = computed<number>(() => {
    return Math.ceil(itemsSize.value / props.pageSize)
})
const pageOfItems = computed<any[]>(() => {
    if (props.items instanceof Array) {
        return props.items.slice(0, props.page * props.pageSize)
    } else if (props.items instanceof List) {
        return props.items.slice(0, props.page * props.pageSize).toArray()
    } else {
        throw new UnexpectedError('Expected array or list of items')
    }
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
