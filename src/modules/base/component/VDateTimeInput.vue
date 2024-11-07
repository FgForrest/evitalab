<script setup lang="ts">

import { useI18n } from 'vue-i18n'
import { computed, ref, watch } from 'vue'
import { DateTime } from 'luxon'
import VTimeOffsetPicker from '@/modules/base/component/VTimeOffsetPicker.vue'
import { Toaster, useToaster } from '@/modules/notification/service/Toaster'
import { timeOffsetFrom } from '@/utils/dateTime'

enum Step {
    Date = 0,
    Time = 1,
    TimeOffset = 2
}

const toaster: Toaster = useToaster()
const { t } = useI18n()

const props = withDefaults(
    defineProps<{
        label?: string,
        disabled?: boolean,
        defaultTimeOffset?: string,
        min?: DateTime,
        max?: DateTime
    }>(),
    {
        label: undefined,
        disabled: false,
        defaultTimeOffset: () => timeOffsetFrom(DateTime.now())
    }
)

/**
 * Wizard
 */

const showMenu = ref<boolean>(false)
watch(showMenu, (newValue) => {
    if (newValue) {
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

/**
 * Raw data
 */

const timeOffset = ref<string>()
const timeOffsetOverriddenByModel = ref<boolean>(false)
watch(
    () => props.defaultTimeOffset,
    (newDefaultTimeOffset) => {
        if (!timeOffsetOverriddenByModel.value) {
            timeOffset.value = newDefaultTimeOffset
        }
    },
    { immediate: true }
)

const date = ref<Date | undefined>(undefined)
const isoDate = computed<string | undefined>(() => {
    if (date.value == undefined) {
        return undefined
    }
    return `${date.value.getFullYear()}-${String(date.value.getMonth() + 1).padStart(2, '0')}-${String(date.value.getDate()).padStart(2, '0')}`
})
watch(date, (newValue, oldValue) => {
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

/**
 * Computed data
 */

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

const model = defineModel<DateTime>({ required: false })
watch(
    model,
    (newModel) => {
        if (newModel == undefined) {
            return
        }
        // We need to specify the date this way without specific time offset so
        // that it thinks that the actual offset is the local offset.
        // This makes sure that the picker displays correct date according to the
        // actual offset not according to local offset of the device.
        date.value = new Date(
            newModel.year,
            newModel.month - 1,
            newModel.day,
            newModel.hour,
            newModel.minute,
            newModel.second
        )
        time.value = newModel
            .set({ millisecond: 0 })
            .toISOTime({ includeOffset: false, suppressMilliseconds: true })!
        timeOffset.value = timeOffsetFrom(newModel)
        timeOffsetOverriddenByModel.value = true
    },
    { immediate: true }
)

const error = computed<string | undefined>(() => {
    if (computedOffsetDateTime.value == undefined) {
        return undefined
    }

    if (props.min != undefined && computedOffsetDateTime.value < props.min) {
        return t('common.input.dateTime.error.olderThanMin')
    }
    if (props.max != undefined && computedOffsetDateTime.value > props.max) {
        return t('common.input.dateTime.error.newerThanMax')
    }

    return undefined
})

const displayedOffsetDateTime = computed<string>(() => {
    if (model.value == undefined) {
        return ''
    }
    return model.value.toLocaleString(DateTime.DATETIME_FULL_WITH_SECONDS)
})

function confirm(): void {
    if (computedOffsetDateTime.value == undefined) {
        throw new Error('Missing offset date time.')
    }
    if (error.value != undefined) {
        return
    }

    showMenu.value = false
    model.value = computedOffsetDateTime.value
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
            <VSheet v-if="showMenu" elevation="6" class="wizard">
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

                <div v-if="currentStep < Step.TimeOffset" class="wizard__time-offset-info text-disabled">
                    {{ t('common.input.dateTime.help.timeOffset', { offset: timeOffset }) }}
                </div>

                <VScrollXTransition v-show="error != undefined">
                    <VAlert
                        type="error"
                        icon="mdi-alert-circle-outline"
                        class="wizard__error-alert"
                    >
                        {{ error }}
                    </VAlert>
                </VScrollXTransition>

                <footer class="wizard__actions">
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
                        :disabled="error != undefined"
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
.wizard {
    width: min-content;

    &__time-offset-info {
        text-align: center;
        margin: 0 1rem 1rem;
    }

    &__error-alert {
        margin: 0 1rem 1rem;
    }

    &__actions {
        display: flex;
        padding: 0 1rem 1rem;
        gap: 0.5rem;
    }
}
</style>
