<script setup lang="ts">
/**
 * Generated form of all parameters of a REST operation variant: path parameters first, required ones marked with an
 * asterisk. Unset optional parameters are not sent. The `{locale}` path parameter of a localized variant is driven
 * by the console's locale switch and is shown read-only.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { List as ImmutableList } from 'immutable'
import { RestOperation } from '@/modules/rest-console/console/model/RestOperation'
import { RestParameter } from '@/modules/rest-console/console/model/RestParameter'
import {
    isRestParameterValueSet,
    type RestParameterValue,
    type RestParameterValues
} from '@/modules/rest-console/console/model/RestParameterValue'
import { isLocaleDrivenParameter } from '@/modules/rest-console/console/service/buildRestRequest'
import RestParameterInput from '@/modules/rest-console/console/component/RestParameterInput.vue'

const { t } = useI18n()

const props = defineProps<{
    operation: RestOperation
    values: RestParameterValues
    locale: string | undefined
    locales: ImmutableList<string>
}>()
const emit = defineEmits<{
    (e: 'update:values', value: RestParameterValues): void
}>()

const setCount = computed<number>(() => props.operation.parameters
    .filter(parameter => isLocaleDrivenParameter(props.operation, parameter)
        ? props.locale != undefined
        : isRestParameterValueSet(props.values[parameter.name]))
    .size
)

function updateValue(parameter: RestParameter, value: RestParameterValue | undefined): void {
    const newValues: Record<string, RestParameterValue> = { ...props.values }
    if (value == undefined) {
        delete newValues[parameter.name]
    } else {
        newValues[parameter.name] = value
    }
    emit('update:values', newValues)
}
</script>

<template>
    <section class="rest-parameter-form">
        <header class="rest-parameter-form__header">
            <span class="text-overline">{{ t('restConsole.section.parameters') }}</span>
            <span class="text-caption text-disabled">
                {{ t('restConsole.section.parameterCount', { set: setCount, defined: operation.parameters.size }) }}
            </span>
        </header>

        <p v-if="operation.parameters.isEmpty()" class="text-body-2 text-disabled">
            {{ t('restConsole.parameter.noParameters') }}
        </p>

        <div v-else class="rest-parameter-form__grid">
            <template v-for="parameter in operation.parameters" :key="`${parameter.location}:${parameter.name}`">
                <div class="rest-parameter-form__name">
                    <span class="rest-parameter-form__name-text">
                        {{ parameter.name }}<span v-if="parameter.required" class="text-error">*</span>
                    </span>
                    <span class="text-caption text-disabled">{{ parameter.location }} · {{ parameter.displayType }}</span>
                    <VTooltip v-if="parameter.description" activator="parent" location="start" max-width="400">
                        {{ parameter.description }}
                    </VTooltip>
                </div>

                <VTextField
                    v-if="isLocaleDrivenParameter(operation, parameter)"
                    :model-value="locale"
                    :hint="t('restConsole.locale.setByLocale')"
                    persistent-hint
                    readonly
                    density="compact"
                    variant="outlined"
                />
                <RestParameterInput
                    v-else
                    :parameter="parameter"
                    :model-value="values[parameter.name]"
                    :locales="locales"
                    @update:model-value="updateValue(parameter, $event)"
                />
            </template>
        </div>
    </section>
</template>

<style lang="scss" scoped>
.rest-parameter-form {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    &__header {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
    }

    &__grid {
        display: grid;
        grid-template-columns: minmax(8rem, max-content) minmax(0, 1fr);
        gap: 0.5rem 1rem;
        align-items: start;
    }

    &__name {
        display: flex;
        flex-direction: column;
        padding-top: 0.25rem;
        min-width: 0;
    }

    &__name-text {
        font-family: monospace;
        white-space: nowrap;
    }
}
</style>
