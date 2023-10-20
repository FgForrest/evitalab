<script setup lang="ts">
import { EvitaDBConnection } from '@/model/lab'
import { LabService, useLabService } from '@/services/lab.service'
import { Toaster, useToaster } from '@/services/editor/toaster'

const labService: LabService = useLabService()
const toaster: Toaster = useToaster()

const props = defineProps<{
    modelValue: boolean
    connection: EvitaDBConnection
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
}>()

function cancel() {
    emit('update:modelValue', false)
}

function removeConnection(): void {
    try {
        labService.removeConnection(props.connection.id)
    } catch (e: any) {
        toaster.error(e)
        return
    }
    toaster.success('Connection removed.')
    emit('update:modelValue', false)
}
</script>

<template>
    <VDialog
        :model-value="modelValue"
        max-width="30rem"
        @update:model-value="$emit('update:modelValue', $event)"
    >
        <template #activator="{ props }">
            <slot name="activator" v-bind="props"/>
        </template>

        <VCard class="py-8 px-4">
            <VCardTitle>Remove connection</VCardTitle>
            <VCardText class="mb-4">
                Are you sure you want to remove the connection <strong>{{ connection.name }}</strong>?
            </VCardText>
            <VCardActions>
                <VSpacer/>
                <VBtn @click="cancel"
                variant="tonal">
                    Cancel
                </VBtn>
                <VBtn
                    variant="outlined"
                    prepend-icon="mdi-delete"
                    @click="removeConnection"
                >
                    Remove
                </VBtn>
            </VCardActions>
        </VCard>
    </VDialog>
</template>

<style lang="scss" scoped>

</style>
