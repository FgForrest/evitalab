<script setup lang="ts">
/**
 * Tooltip for action (e.g., button to open dialog, save changes, etc.). It supports rendering keyboard shortcuts for the
 * action.
 */

import { Command } from '@/model/editor/keymap/Command'
import { computed } from 'vue'
import { Keymap, useKeymap } from '@/model/editor/keymap/Keymap'

const keymap: Keymap = useKeymap()

const props = defineProps<{
    // todo when we have i18n, we could use the command for the actual tooltip text as well, however what about commands without keyboard shortcuts?
    command?: Command
}>()

const keyboardShortcut = computed<string | undefined>(() => {
    if (props.command == undefined) {
        return undefined
    }
    return keymap.prettyPrint(props.command)
})
</script>

<template>
    <VTooltip activator="parent">
        <slot />

        <VChip v-if="command != undefined" class="ml-2">{{ keyboardShortcut }}</VChip>
    </VTooltip>
</template>

<style lang="scss" scoped>

</style>
