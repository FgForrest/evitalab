<script setup lang="ts">
import VListItemDivider from '@/components/base/VListItemDivider.vue'

const props = defineProps<{
    selected: string | undefined,
    dataLocales: string[]
}>()
const emit = defineEmits<{
    (e: 'update:selected', value: string | undefined): void
}>()

function handleDataLocaleSelect(selected: unknown[]) {
    if (selected.length > 0) {
        const dataLocale: string = selected[0] as string
        if (dataLocale === 'none') {
            emit('update:selected', undefined)
        } else {
            emit('update:selected', dataLocale)
        }
    } else {
        emit('update:selected', undefined)
    }
}
</script>

<template>
    <VBtn
        icon
        density="comfortable"
    >
        <VIcon v-if="!selected">mdi-translate-off</VIcon>
        <VIcon v-else>mdi-translate</VIcon>

        <VTooltip activator="parent">
            Select data locale
        </VTooltip>

        <VMenu activator="parent">
            <VList
                :selected="[selected ? selected : 'none']"
                density="compact"
                min-width="100"
                @update:selected="handleDataLocaleSelect"
            >
                <VListItem
                    value="none"
                >
                    <VListItemTitle>None</VListItemTitle>
                </VListItem>

                <VListItemDivider />

                <VListItem
                    v-for="locale in dataLocales"
                    :key="locale"
                    :value="locale"
                >
                    <VListItemTitle>{{ locale }}</VListItemTitle>
                </VListItem>
            </VList>
        </VMenu>
    </VBtn>
</template>

<style lang="scss" scoped>

</style>
