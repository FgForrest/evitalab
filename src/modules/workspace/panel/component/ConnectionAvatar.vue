<script setup lang="ts">

import { computed } from 'vue'
import { Connection } from '@/modules/connection/model/Connection'

const props = defineProps<{
    connection: Connection
}>()

const shortName = computed<string>(() => {
    return props.connection.shortName
})
</script>

<template>
    <VTooltip>
        <template #default>
            {{ connection.name }}
        </template>

        <template #activator="{ props }">
            <VAvatar size="32" border="sm" v-bind="props">
                <span>{{ shortName }}</span>
            </VAvatar>
        </template>
    </VTooltip>
</template>

<style lang="scss" scoped>

</style>
