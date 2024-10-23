<script setup lang="ts">
/**
 * Main lab panel with navigation and useful links
 */

import { onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Keymap, useKeymap } from '@/modules/keymap/service/Keymap'
import { PanelType } from '@/modules/workspace/panel/model/PanelType'
import { Command } from '@/modules/keymap/model/Command'
import ManageMenu from '@/modules/workspace/panel/component/ManageMenu.vue'
import VActionTooltip from '@/modules/base/component/VActionTooltip.vue'
import { MenuAction } from '@/modules/base/model/menu/MenuAction'

const keymap: Keymap = useKeymap()
const { t } = useI18n()

const props = defineProps<{
    panel?: string
}>()

const emit = defineEmits<{
    (e: 'update:panel', value: string | null): void
}>()

const mainItems: MenuAction<PanelType>[] = createMainItems()

function createMainItems(): MenuAction<PanelType>[] {
    const mainItems: MenuAction<PanelType>[] = []
    mainItems.push(new MenuAction(
        PanelType.Explorer,
        t(`panel.item.${PanelType.Explorer}`),
        'mdi-connection',
        () => {},
        Command.System_Panels_ConnectionsExplorer
    ))
    return mainItems
}

function selectPanel(item: any): void {
    if (!item.value) {
        emit('update:panel', null)
    } else {
        emit('update:panel', item.id)
    }
}

onMounted(() => {
    // register panel keyboard shortcuts
    keymap.bindGlobal(Command.System_Panels_ConnectionsExplorer, () => {
        if (props.panel === PanelType.Explorer) {
            emit('update:panel', null)
        } else {
            emit('update:panel', PanelType.Explorer)
        }
    })
})
onUnmounted(() => {
    // unregister panel keyboard shortcuts
    keymap.unbindGlobal(Command.System_Panels_ConnectionsExplorer)
})
</script>

<template>
    <VNavigationDrawer
        permanent
        rail
        class="bg-primary-dark"
    >
        <template #prepend>
            <ManageMenu>
                <VAvatar size="30px">
                    <VImg
                        alt="evitaLab Logo"
                        width="30px"
                        height="30px"
                        src="/logo/evitalab-logo-mini.png?raw=true"
                    />
                </VAvatar>
            </ManageMenu>
        </template>

        <VList
            density="compact"
            nav
            :selected="[panel]"
            @click:select="selectPanel"
            class="navigation-items"
        >
            <VListItem v-for="item in mainItems" :key="item.value" :value="item.value">
                <VIcon>
                    {{ item.prependIcon }}
                </VIcon>

                <VActionTooltip :command="item.command">
                    {{ item.title }}
                </VActionTooltip>
            </VListItem>
        </VList>

        <template #append>
            <ul class="lab-nav-links">
                <li>
                    <a href="https://evitadb.io/documentation" target="_blank">
                        <img src="/documentation.svg" :alt="t('panel.link.evitaDBDocumentation.icon.alt')">
                        <VTooltip activator="parent">
                            {{ t('panel.link.evitaDBDocumentation.tooltip') }}
                        </VTooltip>
                    </a>
                </li>
                <li>
                    <a href="https://discord.gg/VsNBWxgmSw" target="_blank">
                        <img src="/discord.svg" :alt="t('panel.link.discord.icon.alt')">
                        <VTooltip activator="parent">
                            {{ t('panel.link.discord.tooltip') }}
                        </VTooltip>
                    </a>
                </li>
            </ul>
        </template>
    </VNavigationDrawer>
</template>

<style lang="scss" scoped>
@import '@/styles/colors.scss';

.lab-nav-links {
    display: flex;
    flex-direction: column;
    list-style: none;
    justify-content: center;
    align-items: center;
    margin: 0 0 1.25rem 0;
    gap: 1.25rem 0;
}
.lab-nav-links li img {
    opacity: .5;
    transition: opacity .2s ease-in-out;
}

.lab-nav-links li:hover img {
    opacity: 1;
}

.navigation-items {
    & :deep(.v-list-item__underlay) {
        display: none;
    }
    & :deep(.v-list-item__overlay) {
        background: transparent;
        opacity: 1;
        border-radius: 50%;
        transition: background-color .1s ease-in-out;
    }
    & :deep(.v-list-item--active > .v-list-item__overlay) {
        background: $primary-lightest;
        opacity: 1;
        border-radius: 50%;
    }
}
</style>
