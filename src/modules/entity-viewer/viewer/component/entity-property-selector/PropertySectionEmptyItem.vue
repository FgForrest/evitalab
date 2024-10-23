<script setup lang="ts">
/**
 * Placeholder item for empty property selector section.
 */

import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
    <VListItem disabled>
        <template #title>
            {{ t('entityViewer.propertySelector.section.placeholder.noItemsForSearchedTerm') }}
        </template>
    </VListItem>
</template>

<style lang="scss" scoped>

</style>
