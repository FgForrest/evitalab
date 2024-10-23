<script setup lang="ts">

import { useI18n } from 'vue-i18n'
import VTabMainActionButton from '@/modules/base/component/VTabMainActionButton.vue'

const { t } = useI18n()

/**
 * Pre-defined button to execute queries.
 */
const props = withDefaults(defineProps<{
    loading?: boolean
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
        <VTooltip activator="parent">
            {{ t('common.button.executeQuery') }}
        </VTooltip>
        {{ t('common.button.run') }}
    </VTabMainActionButton>
</template>

<style lang="scss" scoped>

</style>
