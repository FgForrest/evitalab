<script setup lang="ts">
import { JfrViewerService, useJfrViewerService } from '../service/JfrViewerService'
import { useI18n } from 'vue-i18n'
import { computed, ref } from 'vue'
import { useToaster } from '@/modules/notification/service/Toaster'
import type { Toaster } from '@/modules/notification/service/Toaster'
import VFormDialog from '@/modules/base/component/VFormDialog.vue'
import { EventType } from '@/modules/database-driver/request-response/jfr/EventType'

const jfrViewerService: JfrViewerService = useJfrViewerService()
const toaster: Toaster = useToaster()
const { t } = useI18n()

const props = defineProps<{
    modelValue: boolean
}>()
const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
}>()

const selectedTypesRules = [
    (value: EventType[]): any => {
        if (value != undefined && value.length > 0) return true
        return t('jfrViewer.startRecording.form.events.validations.required')
    }
]

const eventTypes = ref<EventType[]>()
const eventTypesLoaded = ref<boolean>(false)
const selectedTypes = ref<EventType[]>()
const changed = computed<boolean>(() =>
    selectedTypes.value != undefined && selectedTypes.value.length > 0)

loadEventTypes().then()

async function loadEventTypes() {
    try {
        eventTypes.value = await jfrViewerService.getEventTypes()
        selectedTypes.value = eventTypes.value
        eventTypesLoaded.value = true
    } catch (e: any) {
        await toaster.error(t(
            'jfrViewer.startRecording.notification.couldNotLoadEventTypes',
            { reason: e.message }
        ))
    }
}

function reset(): void {
    selectedTypes.value = eventTypes.value
}

async function startRecording(): Promise<boolean> {
    try {
        const started: boolean = await jfrViewerService.startRecording(
           selectedTypes.value!.map((x) => x.id)
        )
        if (started) {
            await toaster.success(t('jfrViewer.startRecording.notification.recordingStarted'))
        } else {
            await toaster.info(t('jfrViewer.startRecording.notification.recordingNotStarted'))
        }
        return true
    } catch (e: any) {
        await toaster.error(t(
            'jfrViewer.startRecording.notification.couldNotStartRecording',
            { reason: e.message }
        ))
        return false
    }
}
</script>

<template>
    <VFormDialog
        :model-value="modelValue"
        :changed="changed"
        scrollable
        confirm-button-icon="mdi-record-circle-outline"
        :confirm="startRecording"
        :reset="reset"
        @update:model-value="emit('update:modelValue', $event)"
    >
        <template #activator="{ props }">
            <slot name="activator" v-bind="{ props }" />
        </template>

        <template #title>
            {{ t('jfrViewer.startRecording.title') }}
        </template>

<!--        todo lho singleline? -->
<!--        todo lho add virtual select all/none item-->
        <template #default>
            <VAutocomplete
                v-model="selectedTypes"
                :items="eventTypes"
                :rules="selectedTypesRules"
                item-title="name"
                multiple
                chips
            />
        </template>

        <template #append-form>
            <VAlert type="info" icon="mdi-information-outline">
                {{ t('jfrViewer.startRecording.info') }}
            </VAlert>
        </template>

        <template #confirm-button-content>
            {{ t('jfrViewer.startRecording.button.startRecording') }}
        </template>
    </VFormDialog>
</template>

<style scoped lang="scss">

</style>
