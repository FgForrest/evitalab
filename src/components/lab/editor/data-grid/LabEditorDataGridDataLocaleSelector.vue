<script setup lang="ts">
/**
 * Selector button to switch data locale.
 */

import VListItemDivider from '@/components/base/VListItemDivider.vue'
import { ref } from 'vue'
import { VBtn } from 'vuetify/components'
import VActionTooltip from '@/components/base/VActionTooltip.vue'
import { Command } from '@/model/editor/keymap/Command'

const props = defineProps<{
    selected: string | undefined,
    dataLocales: string[]
}>()
const emit = defineEmits<{
    (e: 'update:selected', value: string | undefined): void
}>()

const dataLocaleButtonRef = ref<InstanceType<typeof VBtn> | undefined>()

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

function focus(): void {
    dataLocaleButtonRef.value?.$el?.click()
    dataLocaleButtonRef.value?.$el?.focus()
}

defineExpose<{
    focus: () => void
}>({
    focus
})
</script>

<template>
    <VBtn
        ref="dataLocaleButtonRef"
        icon
        density="comfortable"
    >
        <VIcon v-if="!selected">mdi-translate-off</VIcon>
        <VIcon v-else>mdi-translate</VIcon>

        <VActionTooltip :command="Command.EntityGrid_ChangeDataLocale">
            Select data locale
        </VActionTooltip>

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
