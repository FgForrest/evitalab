<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
    <VListItem>
        <span class="pl-8 text-disabled">
            {{ t('common.list.empty') }}
        </span>
    </VListItem>
</template>

<style lang="scss" scoped>

</style>
