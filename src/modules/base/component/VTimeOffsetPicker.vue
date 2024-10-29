<script setup lang="ts">

import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const offsetSplitPattern: RegExp = /:/

const { t } = useI18n()

const props = withDefaults(
    defineProps<{
        modelValue?: string
    }>(),
    {
        modelValue: '+00:00'
    }
)
const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void
}>()

const timeOffsetHours = ref<number>(Number.parseInt(props.modelValue.split(offsetSplitPattern)[0]))
const timeOffsetMinutes = ref<number>(Number.parseInt(props.modelValue.split(offsetSplitPattern)[1]))
watch(
    [timeOffsetHours, timeOffsetMinutes],
    () => {
        const hoursPart: string = String(Math.abs(timeOffsetHours.value)).padStart(2, '0')
        const minutesPart: string = String(timeOffsetMinutes.value).padStart(2, '0')
        const timeOffset: string = `${timeOffsetHours.value >= 0 ? '+' : '-'}${hoursPart}:${minutesPart}`
        emit('update:modelValue', timeOffset)
    }
)
</script>

<template>
    <VPicker>
        <template #title>
            {{ t('common.input.dateTime.timeOffset.title') }}
        </template>

        <template #default>
            <div class="time-offset">
                <!-- offset data are taken from https://en.wikipedia.org/wiki/List_of_UTC_offsets -->
                <VNumberInput
                    v-model="timeOffsetHours"
                    :label="t('common.input.dateTime.timeOffset.hours')"
                    control-variant="stacked"
                    :min="-12"
                    :max="14"
                />
                <VNumberInput
                    v-model="timeOffsetMinutes"
                    :label="t('common.input.dateTime.timeOffset.minutes')"
                    control-variant="stacked"
                    :step="15"
                    :min="0"
                    :max="50"
                />
            </div>
        </template>
    </VPicker>
</template>

<style lang="scss" scoped>
.time-offset {
    display: inline-grid;
    grid-template-columns: 1fr 1fr;
    width: 100%;
    padding: 0 1rem;
    gap: 1rem;
}
</style>
