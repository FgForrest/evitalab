<script setup lang="ts">
/**
 * Menu for managing evitaLab and getting help
 */

import { UnexpectedError } from '@/model/lab'
import { EditorService, useEditorService } from '@/services/editor/editor.service'
import { Toaster, useToaster } from '@/services/editor/toaster'
import { onMounted, onUnmounted } from 'vue'
import { Keymap, useKeymap } from '@/model/editor/keymap/Keymap'
import { Command } from '@/model/editor/keymap/Command'
import VActionTooltip from '@/components/base/VActionTooltip.vue'
import { KeymapViewerRequest } from '@/model/editor/tab/keymapViewer/KeymapViewerRequest'

enum ManageOptionType {
    Keymap = 'keymap',
    EvitaLabGithub = 'evitaLabGithub',
    DiscussEvitaLab = 'discussEvitaLab',
    ReportEvitaLabIssue = 'reportEvitaLabIssue',
    EvitaDBDocumentation = 'evitaDBDocumentation',
    EvitaDBGithub = 'evitaDBGithub',
    DiscussEvitaDB = 'discussEvitaDB',
    ReportEvitaDBIssue = 'reportEvitaDBIssue',
}

const keymap: Keymap = useKeymap()
const editorService: EditorService = useEditorService()
const toaster: Toaster = useToaster()

// todo convert to VList component and add key board shortcut to keymap
const options = [
    { type: 'subheader', title: 'Manage' },
    {
        title: 'Keymap',
        value: ManageOptionType.Keymap,
        command: Command.System_Keymap,
        props: {
            prependIcon: 'mdi-keyboard-outline'
        }
    },
    { type: 'subheader', title: 'evitaLab Help'},
    {
        title: 'evitaLab GitHub',
        value: ManageOptionType.EvitaLabGithub,
        props: {
            prependIcon: 'mdi-github'
        }
    },
    {
        title: 'Discuss evitaLab',
        value: ManageOptionType.DiscussEvitaLab,
        props: {
            prependIcon: 'mdi-forum-outline'
        }
    },
    {
        title: 'Report evitaLab issue',
        value: ManageOptionType.ReportEvitaLabIssue,
        props: {
            prependIcon: 'mdi-bug'
        }
    },
    { type: 'subheader', title: 'evitaDB Help'},
    {
        title: 'evitaDB Documentation',
        value: ManageOptionType.EvitaDBDocumentation,
        props: {
            prependIcon: 'mdi-book-open-variant'
        }
    },
    {
        title: 'evitaDB GitHub',
        value: ManageOptionType.EvitaDBGithub,
        props: {
            prependIcon: 'mdi-github'
        }
    },
    {
        title: 'Discuss evitaDB',
        value: ManageOptionType.DiscussEvitaDB,
        props: {
            prependIcon: 'mdi-forum-outline'
        }
    },
    {
        title: 'Report evitaDB issue',
        value: ManageOptionType.ReportEvitaDBIssue,
        props: {
            prependIcon: 'mdi-bug'
        }
    },
]

function openKeymap() {
    editorService.createTab(KeymapViewerRequest.createNew())
}

function handleOptionClick(selected: any): void {
    if (selected.length > 0) {
        const option: ManageOptionType = selected[0] as ManageOptionType
        switch (option) {
            case ManageOptionType.Keymap:
                openKeymap()
                break
            case ManageOptionType.EvitaLabGithub:
                window.open('https://github.com/lukashornych/evitalab', '_blank');
                break
            case ManageOptionType.DiscussEvitaLab:
                window.open('https://discord.gg/VsNBWxgmSw', '_blank');
                break
            case ManageOptionType.ReportEvitaLabIssue:
                window.open('https://github.com/lukashornych/evitalab/issues/new', '_blank');
                break
            case ManageOptionType.EvitaDBDocumentation:
                window.open('https://evitadb.io/documentation', '_blank');
                break
            case ManageOptionType.EvitaDBGithub:
                window.open('https://github.com/FgForrest/evitaDB', '_blank');
                break
            case ManageOptionType.DiscussEvitaDB:
                window.open('https://discord.gg/VsNBWxgmSw', '_blank');
                break
            case ManageOptionType.ReportEvitaDBIssue:
                window.open('https://github.com/FgForrest/evitaDB/issues/new', '_blank');
                break
            default:
                toaster.error(new UnexpectedError(undefined, `Unknown manage option ${selected[0]}`))
        }
    }
}

onMounted(() => {
    // register manage menu keyboard shortcuts
    keymap.bindGlobal(Command.System_Keymap, openKeymap)
})
onUnmounted(() => {
    // unregister manage menu keyboard shortcuts
    keymap.unbindGlobal(Command.System_Keymap)
})
</script>

<template>
    <VMenu>
        <template #activator="{ props }">
            <VBtn v-bind="props" icon variant="text" class="manage-button">
                <slot />

                <VTooltip activator="parent">
                    Manage evitaLab
                </VTooltip>
            </VBtn>
        </template>

        <VList :items="options" @update:selected="handleOptionClick">
            <template #title="{ item }">
                <VListItemTitle>
                    {{ item.title }}

                    <VActionTooltip v-if="item.command != undefined" :command="item.command">
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
