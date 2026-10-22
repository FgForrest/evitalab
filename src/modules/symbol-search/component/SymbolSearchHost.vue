<script setup lang="ts">
/**
 * Mounted once by each run-mode main view: binds the global symbol search shortcut and renders the popup. Lives in
 * the main views rather than in the connection explorer panel, so the shortcut keeps working while the panel is
 * hidden.
 */
import { onMounted, onUnmounted } from 'vue'
import { Keymap, useKeymap } from '@/modules/keymap/service/Keymap'
import { Command } from '@/modules/keymap/model/Command'
import { SymbolSearchService, useSymbolSearchService } from '@/modules/symbol-search/service/SymbolSearchService'
import SymbolSearchDialog from '@/modules/symbol-search/component/SymbolSearchDialog.vue'

const keymap: Keymap = useKeymap()
const symbolSearchService: SymbolSearchService = useSymbolSearchService()

onMounted(() => {
    keymap.bindGlobal(Command.System_SymbolSearch, () => symbolSearchService.toggle())
})
onUnmounted(() => {
    keymap.unbindGlobal(Command.System_SymbolSearch)
})
</script>

<template>
    <SymbolSearchDialog />
</template>
