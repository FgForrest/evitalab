<script setup lang="ts">

import { useI18n } from 'vue-i18n'
import VTabMainActionButton from '@/modules/base/component/VTabMainActionButton.vue'
import VActionTooltip from '@/modules/base/component/VActionTooltip.vue'
import { Command } from '@/modules/keymap/model/Command.ts'

const { t } = useI18n()

/**
 * Pre-defined button to execute queries.
 */
const props = withDefaults(defineProps<{
    loading?: boolean,
    command: Command,
    title: string
}>(), {
    loading: false
})
const emit = defineEmits<{
    (e: 'click'): void
}>()
</script>

<template>
    <VTabMainActionButton
        :loading="loading"
        prepend-icon="mdi-play-outline"
        @click="emit('click')"
    >
        <VActionTooltip :command="command">
            {{ t('common.button.executeQuery') }}
        </VActionTooltip>

        {{ t(title) }}
    </VTabMainActionButton>
</template>

<style lang="scss" scoped>

</style>
