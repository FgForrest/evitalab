<script setup lang="ts">
/**
 * Icon opening the symbol search popup. Its tooltip advertises the global shortcut.
 */
import { useI18n } from 'vue-i18n'
import { Command } from '@/modules/keymap/model/Command'
import { SymbolSearchService, useSymbolSearchService } from '@/modules/symbol-search/service/SymbolSearchService'
import VActionTooltip from '@/modules/base/component/VActionTooltip.vue'

const symbolSearchService: SymbolSearchService = useSymbolSearchService()
const { t } = useI18n()
</script>

<template>
    <!-- styled like the neighbouring ⋮ menu activator (a bare icon); the wrapper anchors the tooltip -->
    <span class="symbol-search-button">
        <VIcon
            icon="mdi-magnify"
            class="text-gray-light"
            :aria-label="t(`command.${Command.System_SymbolSearch}`)"
            @click="symbolSearchService.open()"
        />
        <VActionTooltip :command="Command.System_SymbolSearch" />
    </span>
</template>

<style lang="scss" scoped>
.symbol-search-button {
    display: inline-flex;
    justify-self: center;
}
</style>
