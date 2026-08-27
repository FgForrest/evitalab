<script setup lang="ts">
/**
 * Menu for managing evitaLab and getting help
 */

import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Keymap, useKeymap } from '@/modules/keymap/service/Keymap'
import { useWorkspaceService, WorkspaceService } from '@/modules/workspace/service/WorkspaceService'
import { Command } from '@/modules/keymap/model/Command'
import {
    KeymapViewerTabFactory,
    useKeymapViewerTabFactory
} from '@/modules/keymap/viewer/workspace/service/KeymapViewerTabFactory'
import VActionTooltip from '@/modules/base/component/VActionTooltip.vue'
import { ManageOptionType } from '@/modules/workspace/panel/model/ManageOptionType'
import { ManageMenuFactory, useManageMenuFactory } from '@/modules/workspace/panel/service/ManageMenuFactory'
import type { MenuItem } from '@/modules/base/model/menu/MenuItem'
import { MenuAction } from '@/modules/base/model/menu/MenuAction'

const keymap: Keymap = useKeymap()
const workspaceService: WorkspaceService = useWorkspaceService()
const keymapViewerTabFactory: KeymapViewerTabFactory = useKeymapViewerTabFactory()
const manageMenuFactory: ManageMenuFactory = useManageMenuFactory()
const { t } = useI18n()

const opened = ref<boolean>(false)

const menuItems = ref<Map<ManageOptionType, MenuItem<ManageOptionType>>>()
const menuItemList = computed<MenuItem<ManageOptionType>[]>(() => {
    if (menuItems.value == undefined) {
        return []
    }
    return Array.from(menuItems.value.values())
})

function openKeymap(): void {
    workspaceService.createTab(keymapViewerTabFactory.createNew())
}

/**
 * Vuetify hands the raw item back in the `title` slot, but types it by the `items` prop, which knows
 * nothing about the shortcut an action may carry.
 */
function commandOf(item: unknown): Command | undefined {
    return item instanceof MenuAction ? item.command : undefined
}

function handleActionClick(action: unknown): void {
    const item: MenuItem<ManageOptionType> | undefined = menuItems.value?.get(action as ManageOptionType)
    if (item instanceof MenuAction) {
        item.execute()
    }
}

onMounted(async () => {
    menuItems.value = await manageMenuFactory.createItems(openKeymap)

    // register manage menu keyboard shortcuts
    keymap.bindGlobal(Command.System_Keymap, openKeymap)
    keymap.bindGlobal(Command.System_ManageMenu, () => opened.value = !opened.value)
})
onUnmounted(() => {
    // unregister manage menu keyboard shortcuts
    keymap.unbindGlobal(Command.System_Keymap)
    keymap.unbindGlobal(Command.System_ManageMenu)
})
</script>

<template>
    <VMenu v-model="opened">
        <template #activator="{ props }">
            <VBtn v-bind="props" icon variant="text" class="manage-button">
                <slot />

                <VActionTooltip :command="Command.System_ManageMenu">
                    {{ t('panel.button.manage') }}
                </VActionTooltip>
            </VBtn>
        </template>

        <VList
            density="compact"
            :items="menuItemList"
            @click:select="handleActionClick($event.id)"
        >
            <template #title="{ item }">
                <VListItemTitle>
                    {{ item.title }}

                    <VActionTooltip v-if="commandOf(item) != undefined" :command="commandOf(item)">
                        {{ item.title }}
                    </VActionTooltip>
                </VListItemTitle>
            </template>
        </VList>
    </VMenu>
</template>

<style lang="scss" scoped>
.manage-button {
    width: 3.5rem;
    height: 3.5rem;
    display: grid;
    justify-items: center;
    align-items: center;
}
</style>
