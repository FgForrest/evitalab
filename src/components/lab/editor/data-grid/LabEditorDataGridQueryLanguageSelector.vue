<script setup lang="ts">

import { QueryLanguage } from '@/model/lab'
import { computed, ref } from 'vue'
import { VBtn, VList } from 'vuetify/components'
import VActionTooltip from '@/components/base/VActionTooltip.vue'
import { Command } from '@/model/editor/keymap/Command'

const queryLanguages = [
    {
        title: 'evitaQL',
        icon: 'mdi-variable',
        value: QueryLanguage.EvitaQL
    },
    {
        title: 'GraphQL',
        icon: 'mdi-graphql',
        value: QueryLanguage.GraphQL
    }
]

const props = defineProps<{
    selected: QueryLanguage
}>()
const emit = defineEmits<{
    (e: 'update:selected', value: QueryLanguage): void
}>()

const queryLanguagesButtonRef = ref<InstanceType<typeof VBtn> | undefined>()

const selectedIcon = computed<string>(() => {
    const language = queryLanguages.find(language => language.value === props.selected)
    return language ? language.icon : 'mdi-application-braces-outline'
})

function focus(): void {
    queryLanguagesButtonRef.value?.$el?.click()
    queryLanguagesButtonRef.value?.$el?.focus()
}

defineExpose<{
    focus: () => void
}>({
    focus
})
</script>

<template>
    <VBtn
        ref="queryLanguagesButtonRef"
        icon
        density="comfortable"
    >
        <VIcon>{{ selectedIcon }}</VIcon>
        <VActionTooltip :command="Command.EntityGrid_ChangeQueryLanguage">Select query language</VActionTooltip>

        <VMenu activator="parent">
            <VList
                :selected="[selected]"
                density="compact"
                @update:selected="emit('update:selected', $event.length > 0 ? $event[0] as QueryLanguage : QueryLanguage.EvitaQL)"
            >
                <VListItem
                    v-for="language in queryLanguages"
                    :key="language.value"
                    :value="language.value"
                >
                    <template #prepend>
                        <VIcon>{{ language.icon }}</VIcon>
                    </template>
                    <VListItemTitle>{{ language.title }}</VListItemTitle>
                </VListItem>
            </VList>
        </VMenu>
    </VBtn>
</template>

<style lang="scss" scoped>


</style>
