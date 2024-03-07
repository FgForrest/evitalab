<script setup lang="ts">
/**
 * Main lab panel with navigation and useful links
 */

import { PanelType } from '@/model/lab'
import LabPanelManageMenu from '@/components/lab/panel/LabPanelManageMenu.vue'
import { Keymap, useKeymap } from '@/model/editor/keymap/Keymap'
import { onMounted, onUnmounted } from 'vue'
import { Command } from '@/model/editor/keymap/Command'
import VActionTooltip from '@/components/base/VActionTooltip.vue'

const keymap: Keymap = useKeymap()

const props = defineProps<{
    panel?: string
}>()

const emit = defineEmits<{
    (e: 'update:panel', value: string | null): void
}>()

const mainItems = [
    {
        title: 'Explorer',
        value: PanelType.Explorer,
        prependIcon: 'mdi-connection',
        command: Command.System_Panels_ConnectionsExplorer
    }
]

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
            <LabPanelManageMenu>
                <VAvatar size="30px">
                    <VImg
                        alt="evitaLab Logo"
                        width="30px"
                        height="30px"
                        src="/logo/evitalab-logo-mini.png?raw=true"
                    />
                </VAvatar>
            </LabPanelManageMenu>
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
                        <img src="/documentation.svg" alt="evitaDB Documentation">
                        <VTooltip activator="parent">
                            Open evitaDB documentation
                        </VTooltip>
                    </a>
                </li>
                <li>
                    <a href="https://discord.gg/VsNBWxgmSw" target="_blank">
                        <img src="/discord.svg" alt="Discord icon">
                        <VTooltip activator="parent">
                            Discuss on Discord
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
