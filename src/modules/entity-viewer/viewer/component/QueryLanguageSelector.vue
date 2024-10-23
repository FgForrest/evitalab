<script setup lang="ts">

import { computed, ref } from 'vue'
import { QueryLanguage } from '@/modules/entity-viewer/viewer/model/QueryLanguage'
import { VBtn } from 'vuetify/components'
import { Command } from '@/modules/keymap/model/Command'
import VActionTooltip from '@/modules/base/component/VActionTooltip.vue'
import { MenuAction } from '@/modules/base/model/menu/MenuAction'

const props = defineProps<{
    selected: QueryLanguage
}>()
const emit = defineEmits<{
    (e: 'update:selected', value: QueryLanguage): void
}>()

const queryLanguagesButtonRef = ref<InstanceType<typeof VBtn> | undefined>()

const actions: MenuAction<QueryLanguage>[] = createActions()

const selectedIcon = computed<string>(() => {
    const language = actions.find(language => language.value === props.selected)
    return language ? language.prependIcon : 'mdi-application-braces-outline'
})

function focus(): void {
    queryLanguagesButtonRef.value?.$el?.click()
    queryLanguagesButtonRef.value?.$el?.focus()
}

function createActions(): MenuAction<QueryLanguage>[] {
    const actions: MenuAction<QueryLanguage>[] = []
    actions.push(
        new MenuAction<QueryLanguage>(
            QueryLanguage.EvitaQL,
            'evitaQL',
            'mdi-variable',
            () => {}
        )
    )
    actions.push(
        new MenuAction<QueryLanguage>(
            QueryLanguage.GraphQL,
            'GraphQL',
            'mdi-graphql',
            () => {}
        )
    )
    return actions
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
        <VActionTooltip :command="Command.EntityViewer_ChangeQueryLanguage" />

        <VMenu activator="parent">
            <VList
                :selected="[selected]"
                density="compact"
                :items="actions"
                @update:selected="emit('update:selected', $event.length > 0 ? $event[0] as QueryLanguage : QueryLanguage.EvitaQL)"
            />
        </VMenu>
    </VBtn>
</template>

<style lang="scss" scoped>


</style>
