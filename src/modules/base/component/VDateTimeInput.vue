<script setup lang="ts">

import { useI18n } from 'vue-i18n'
import { computed, ref, watch } from 'vue'
import { DateTime } from 'luxon'
import VTimeOffsetPicker from '@/modules/base/component/VTimeOffsetPicker.vue'
import { Toaster, useToaster } from '@/modules/notification/service/Toaster'

enum Step {
    Date = 0,
    Time = 1,
    TimeOffset = 2
}

const toaster: Toaster = useToaster()
const { t } = useI18n()

const props = withDefaults(
    defineProps<{
        modelValue?: DateTime,
        label?: string,
        disabled?: boolean,
        defaultTimeOffset?: string,
        min?: DateTime,
        max?: DateTime
    }>(),
    {
        modelValue: undefined,
        label: undefined,
        disabled: false,
        defaultTimeOffset: '+00:00'
    }
)
const emit = defineEmits<{
    (e: 'update:modelValue', value: DateTime): void
}>()

const showMenu = ref<boolean>(false)
watch(showMenu, (newValue) => {
    if (!newValue) {
        currentStep.value = Step.Date
    }
})

const currentStep = ref<Step>(Step.Date)
const canGoNextStep = computed<boolean>(() => {
    switch (currentStep.value) {
        case Step.Date: return date.value != undefined
        case Step.Time: return time.value != undefined && time.value.length > 0
        default: return false
    }
})

function goToPreviousStep(): void {
    if (currentStep.value > Step.Date) {
        currentStep.value--
    }
}

function goToNextStep(): void {
    if (currentStep.value < Step.TimeOffset) {
        currentStep.value++
    }
}

const timeOffset = ref<string>(props.defaultTimeOffset)
watch(
    () => props.defaultTimeOffset,
    () => timeOffset.value = props.defaultTimeOffset,
    { immediate: true }
)

const date = ref<Date>()
const isoDate = computed<string | undefined>(() => {
    if (date.value == undefined) {
        return undefined
    }
    return `${date.value.getFullYear()}-${String(date.value.getMonth() + 1).padStart(2, '0')}-${String(date.value.getDate()).padStart(2, '0')}`
})
watch(date, (newValue) => {
    if (newValue != undefined) {
        currentStep.value = Step.Time
    }
})
const minDate = computed<string | undefined>(() => {
    if (props.min == undefined) {
        return undefined
    }
    return props.min
        .setZone(timeOffset.value) // we need the date in picker's offset, not in the inputted one
        .toISODate()!
})
const maxDate = computed<string | undefined>(() => {
    if (props.max == undefined) {
        return undefined
    }
    return props.max
        .setZone(timeOffset.value) // we need the date in picker's offset, not in the inputted one
        .toISODate()!
})

const time = ref<string>('')
watch(time, (newValue) => {
    if (newValue != undefined && newValue.length > 0) {
        currentStep.value = Step.TimeOffset
    }
})
const minTime = computed<string | undefined>(() => {
    if (isoDate.value == undefined) {
        return undefined
    }
    if (props.min == undefined) {
        return undefined
    }
    if (isoDate.value !== minDate.value) {
        return undefined
    }
    return props.min
        .setZone(timeOffset.value)
        .toISOTime({
            suppressMilliseconds: true,
            includeOffset: false
        })!
})
const maxTime = computed<string | undefined>(() => {
    if (isoDate.value == undefined) {
        return undefined
    }
    if (props.max == undefined) {
        return undefined
    }
    if (isoDate.value !== maxDate.value) {
        return undefined
    }
    return props.max
        .setZone(timeOffset.value)
        .toISOTime({
            suppressMilliseconds: true,
            includeOffset: false
        })!
})

const computedOffsetDateTime = computed<DateTime | undefined>(() => {
    if (isoDate.value == undefined) {
        return undefined
    }
    if (time.value == undefined || time.value.length === 0) {
        return undefined
    }
    if (timeOffset.value == undefined || timeOffset.value.length === 0) {
        return undefined
    }

    const datePart: string = isoDate.value
    const timePart: string = time.value
    const timeOffsetPart: string = timeOffset.value
    const rawOffsetDateTime: string = `${datePart}T${timePart}${timeOffsetPart}`

    return DateTime.fromISO(rawOffsetDateTime)
        .setZone(timeOffset.value) // a little bit of hack to not use default device locale
})
const displayedOffsetDateTime = ref<string>('')

function confirm(): void {
    if (computedOffsetDateTime.value == undefined) {
        throw new Error('Missing offset date time.')
    }

    const offsetDateTime: DateTime = computedOffsetDateTime.value
    if (props.min != undefined && offsetDateTime < props.min) {
        toaster.error(t('common.input.dateTime.error.olderThanMin'))
        currentStep.value = Step.Date
        return
    }
    if (props.max != undefined && offsetDateTime > props.max) {
        toaster.error(t('common.input.dateTime.error.newerThanMax'))
        currentStep.value = Step.Date
        return
    }

    displayedOffsetDateTime.value = computedOffsetDateTime.value
        .toLocaleString(DateTime.DATETIME_FULL)
    showMenu.value = false
    emit('update:modelValue', offsetDateTime)
}
</script>

<template>
    <VTextField
        :model-value="displayedOffsetDateTime"
        :active="showMenu"
        :focus="showMenu"
        :label="label"
        :disabled="disabled"
        readonly
    >
        <VMenu
            v-model="showMenu"
            :close-on-content-click="false"
            activator="parent"
            min-width="0"
        >
            <VSheet v-if="showMenu" elevation="6">
                <VWindow v-if="showMenu" v-model="currentStep">
                    <VWindowItem>
                        <VDatePicker
                            v-model="date"
                            :min="minDate"
                            :max="maxDate"
                            hide-weekdays
                        />
                    </VWindowItem>
                    <VWindowItem>
                        <VTimePicker
                            v-model="time"
                            :min="minTime"
                            :max="maxTime"
                            format="24hr"
                            use-seconds
                        />
                    </VWindowItem>
                    <VWindowItem>
                        <VTimeOffsetPicker v-model="timeOffset" />
                    </VWindowItem>
                </VWindow>

                <div v-if="currentStep < Step.TimeOffset" class="time-offset-info text-disabled">
                    {{ t('common.input.dateTime.help.timeOffset', { offset: timeOffset }) }}
                </div>

                <footer class="actions">
                    <VBtn
                        v-if="currentStep > Step.Date"
                        variant="tonal"
                        prepend-icon="mdi-chevron-left"
                        @click="goToPreviousStep"
                    >
                        {{ t('common.button.previous') }}
                    </VBtn>

                    <VSpacer />

                    <VBtn
                        v-if="currentStep < Step.TimeOffset"
                        prepend-icon="mdi-chevron-right"
                        :disabled="!canGoNextStep"
                        @click="goToNextStep"
                    >
                        {{ t('common.button.next') }}
                    </VBtn>
                    <VBtn
                        v-else-if="currentStep === Step.TimeOffset"
                        prepend-icon="mdi-check"
                        @click="confirm"
                    >
                        {{ t('common.button.confirm') }}
                    </VBtn>
                </footer>
            </VSheet>
        </VMenu>
    </VTextField>
</template>

<style lang="scss" scoped>
.time-offset-info {
    text-align: center;
    margin: 0 1rem 1rem;
}

.actions {
    display: flex;
    padding: 0 1rem 1rem;
    gap: 0.5rem;
}
</style>
