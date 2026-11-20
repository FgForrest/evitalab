<script setup lang="ts">
/**
 * Coloured chip with the HTTP method of a REST operation.
 */
import { computed } from 'vue'
import { RestHttpMethod } from '@/modules/database-driver/connector/rest/model/RestHttpMethod'

const props = defineProps<{
    method: RestHttpMethod
}>()

const color = computed<string>(() => {
    switch (props.method) {
        case RestHttpMethod.Get: return 'info'
        case RestHttpMethod.Post: return 'success'
        case RestHttpMethod.Put:
        case RestHttpMethod.Patch: return 'warning'
        case RestHttpMethod.Delete: return 'error'
        default: return 'default'
    }
})
</script>

<template>
    <VChip
        :color="color"
        variant="tonal"
        size="x-small"
        label
        class="rest-method-chip"
    >
        {{ method }}
    </VChip>
</template>

<style lang="scss" scoped>
.rest-method-chip {
    font-family: monospace;
    min-width: 3.75rem;
    justify-content: center;
    flex: none;
}
</style>
