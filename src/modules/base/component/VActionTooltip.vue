<script setup lang="ts">
/**
 * Tooltip for action (e.g., button to open dialog, save changes, etc.). It supports rendering keyboard shortcuts for the
 * action.
 */

import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Keymap, useKeymap } from '@/modules/keymap/service/Keymap'
import { Command } from '@/modules/keymap/model/Command'

const keymap: Keymap = useKeymap()
const { t } = useI18n()

const props = defineProps<{
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
        <slot>
            {{ command != undefined ? t(`command.${command}`) : '' }}
        </slot>

        <VChip v-if="command != undefined" density="compact" class="ml-2">{{ keyboardShortcut }}</VChip>
    </VTooltip>
</template>

<style lang="scss" scoped>

</style>
