<script setup lang="ts">
/**
 * Input for a single REST operation parameter, chosen by the parameter's kind. An optional parameter can always be
 * returned to "unset", which means it is not sent at all.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { List as ImmutableList } from 'immutable'
import { DateTime } from 'luxon'
import VDateTimeInput from '@/modules/base/component/VDateTimeInput.vue'
import { RestParameter } from '@/modules/rest-console/console/model/RestParameter'
import { RestParameterKind } from '@/modules/rest-console/console/model/RestParameterKind'
import type { RestParameterValue } from '@/modules/rest-console/console/model/RestParameterValue'
import { RestParameterValidationFailure } from '@/modules/rest-console/console/model/RestParameterValidationFailure'
import { validateRestParameterValue } from '@/modules/rest-console/console/service/validateRestParameterValue'

const { t } = useI18n()

const props = defineProps<{
    parameter: RestParameter
    modelValue: RestParameterValue | undefined
    /**
     * Locales offered by locale parameters.
     */
    locales: ImmutableList<string>
}>()
const emit = defineEmits<{
    (e: 'update:modelValue', value: RestParameterValue | undefined): void
}>()

/**
 * Value used for "unset" in the boolean toggle, which cannot carry `undefined`.
 */
const unsetBoolean: string = ''

const kind = computed<RestParameterKind>(() => props.parameter.kind)

const selectItems = computed<string[]>(() => {
    if (kind.value === RestParameterKind.Locale || kind.value === RestParameterKind.LocaleArray) {
        return props.locales.size > 0 ? props.locales.toArray() : props.parameter.enumValues.toArray()
    }
    return props.parameter.enumValues.toArray()
})

const stringValue = computed<string>(() => typeof props.modelValue === 'string' ? props.modelValue : '')
const arrayValue = computed<string[]>(() => Array.isArray(props.modelValue) ? [...props.modelValue] : [])
const dateTimeValue = computed<DateTime | undefined>(() => {
    const dateTime: DateTime = DateTime.fromISO(stringValue.value, { setZone: true })
    return dateTime.isValid ? dateTime : undefined
})

const placeholder = computed<string | undefined>(() => {
    if (kind.value === RestParameterKind.StringArray) {
        return t('restConsole.parameter.arrayPlaceholder')
    }
    return props.parameter.example
})

const rules = [
    (): boolean | string => {
        const failure: RestParameterValidationFailure | undefined =
            validateRestParameterValue(props.parameter, props.modelValue)
        return failure == undefined ? true : t(`restConsole.validation.${failure}`)
    }
]

function updateString(value: string | null | undefined): void {
    emit('update:modelValue', value == undefined || value.length === 0 ? undefined : value)
}

function updateArray(value: string[] | null | undefined): void {
    const items: string[] = (value ?? []).map(it => String(it)).filter(it => it.trim().length > 0)
    emit('update:modelValue', items.length === 0 ? undefined : items)
}

function updateDateTime(value: DateTime | undefined): void {
    emit('update:modelValue', value == undefined ? undefined : value.toISO({ suppressMilliseconds: true })!)
}

function updateBoolean(value: string | null | undefined): void {
    emit('update:modelValue', value == undefined || value === unsetBoolean ? undefined : value)
}
</script>

<template>
    <VBtnToggle
        v-if="kind === RestParameterKind.Boolean"
        :model-value="stringValue"
        color="primary-lightest"
        density="compact"
        variant="outlined"
        divided
        mandatory
        class="rest-parameter-input__toggle"
        @update:model-value="updateBoolean"
    >
        <VBtn v-if="!parameter.required" :value="unsetBoolean" size="small">
            {{ t('restConsole.parameter.unset') }}
        </VBtn>
        <VBtn value="true" size="small">true</VBtn>
        <VBtn value="false" size="small">false</VBtn>
    </VBtnToggle>

    <VSelect
        v-else-if="kind === RestParameterKind.Enum || kind === RestParameterKind.Locale"
        :model-value="stringValue.length > 0 ? stringValue : null"
        :items="selectItems"
        :clearable="!parameter.required"
        :rules="rules"
        density="compact"
        variant="outlined"
        hide-details="auto"
        @update:model-value="updateString"
    />

    <VSelect
        v-else-if="kind === RestParameterKind.EnumArray || kind === RestParameterKind.LocaleArray"
        :model-value="arrayValue"
        :items="selectItems"
        :rules="rules"
        multiple
        chips
        closable-chips
        clearable
        density="compact"
        variant="outlined"
        hide-details="auto"
        @update:model-value="updateArray"
    />

    <VCombobox
        v-else-if="kind === RestParameterKind.StringArray"
        :model-value="arrayValue"
        :placeholder="placeholder"
        :rules="rules"
        multiple
        chips
        closable-chips
        clearable
        density="compact"
        variant="outlined"
        hide-details="auto"
        @update:model-value="updateArray"
    />

    <VDateTimeInput
        v-else-if="kind === RestParameterKind.DateTime"
        :model-value="dateTimeValue"
        :clearable="!parameter.required"
        density="compact"
        variant="outlined"
        hide-details="auto"
        @update:model-value="updateDateTime"
    />

    <VTextField
        v-else
        :model-value="stringValue"
        :placeholder="placeholder"
        :rules="rules"
        :inputmode="kind === RestParameterKind.Integer || kind === RestParameterKind.Number ? 'numeric' : undefined"
        :clearable="!parameter.required"
        density="compact"
        variant="outlined"
        hide-details="auto"
        @update:model-value="updateString"
    />
</template>

<style lang="scss" scoped>
.rest-parameter-input__toggle {
    height: 2.5rem;
}
</style>
