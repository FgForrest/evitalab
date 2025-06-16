<script setup lang="ts">
/**
 * Main lab panel with navigation and useful links
 */

import { computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Keymap, useKeymap } from '@/modules/keymap/service/Keymap'
import { Command } from '@/modules/keymap/model/Command'
import ManageMenu from '@/modules/workspace/panel/component/ManageMenu.vue'
import ConnectionAvatar from '@/modules/workspace/panel/component/ConnectionAvatar.vue'
import { ConnectionService, useConnectionService } from '@/modules/connection/service/ConnectionService'
import { Connection } from '@/modules/connection/model/Connection'
import type { ConnectionId } from '@/modules/connection/model/ConnectionId'

const connectionService: ConnectionService = useConnectionService()
const keymap: Keymap = useKeymap()
const { t } = useI18n()

const props = defineProps<{
    showPanel?: boolean
}>()

const connection: Connection = connectionService.getConnection()
const selectedConnections = computed<ConnectionId[]>(() => {
    if (props.showPanel) {
        return [connection.id]
    } else {
        return []
    }
})

const emit = defineEmits<{
    (e: 'update:showPanel', value: boolean): void
}>()

function selectConnection(item: any): void {
    if (!item.value) {
        emit('update:showPanel', false)
    } else {
        emit('update:showPanel', true)
    }
}

onMounted(() => {
    // register panel keyboard shortcuts
    keymap.bindGlobal(Command.System_Panels_Connection, () => {
        if (props.showPanel) {
            emit('update:showPanel', false)
        } else {
            emit('update:showPanel', true)
        }
    })
})
onUnmounted(() => {
    // unregister panel keyboard shortcuts
    keymap.unbindGlobal(Command.System_Panels_Connection)
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
            :selected="selectedConnections"
            @click:select="selectConnection"
            class="navigation-items"
        >
            <VListItem :key="connection.id" :value="connection.id">
                <ConnectionAvatar :connection="connection" />
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
@use '@/styles/colors.scss' as *;

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
    & :deep(.v-list-item) {
        padding: 0.23rem;
    }
    & :deep(.v-list-item__underlay) {
        display: none;
    }
    & :deep(.v-list-item__overlay) {
        background: transparent;
        opacity: 1;
        border-radius: 50%;
        transition: background-color .1s ease-in-out;
    }
    & :deep(.v-list-item__content) {
        width: 2rem;
        height: 2rem;
    }
    & :deep(.v-list-item--active > .v-list-item__overlay) {
        background: $primary-lightest;
        opacity: 1;
        border-radius: 4px;
        width: 2.5rem;
        height: 2.5rem;
    }
}
</style>
