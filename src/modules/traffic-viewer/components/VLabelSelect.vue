<script setup lang="ts">

/**
 * Select input for selected label by name and values.
 */

import { Label } from '@/modules/connection/model/traffic/Label'
import Immutable from 'immutable'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = withDefaults(
    defineProps<{
        modelValue: Label[],
        label?: string,
        hint?: string,
        clearable?: boolean,
        hideDetails?: boolean,
        labelNamesProvider: (nameStartsWith: string) => Promise<Immutable.List<string>>,
        labelValuesProvider: (labelName: string, valueStartsWith: string) => Promise<Immutable.List<string>>
    }>(),
    {
        label: undefined,
        hint: undefined,
        clearable: false,
        hideDetails: false,
    }
)
const emit = defineEmits<{
    (e: 'update:modelValue', value: Label[]): void
}>()

const showMenu = ref<boolean>(false)
const showNewLabelForm = ref<boolean>(false)
watch(showMenu, (value: boolean) => {
    if (!value) {
        showNewLabelForm.value = false
    }
})

const availableLabelNames = ref<string[]>([])
async function loadLabelNames(searchedLabelName?: string): Promise<void> {
    availableLabelNames.value = (await props.labelNamesProvider(searchedLabelName || '')).toArray()
}
loadLabelNames('').then()

const newLabelName = ref<string | undefined>(undefined)

const availableLabelValues = ref<string[]>([])
async function loadLabelValues(searchedLabelValue: string): Promise<void> {
    availableLabelValues.value = (await props.labelValuesProvider(newLabelName.value!, searchedLabelValue)).toArray()
}
watch(newLabelName, async () => {
    if (newLabelName.value == undefined || newLabelName.value.trim().length === 0) {
        await loadLabelNames('')
    } else {
        await loadLabelValues('')
    }
})

const newLabelValue = ref<string>('')

const displayedLabels = computed<string>(() => {
    if (props.modelValue.length === 0) {
        return ''
    }
    //@ts-ignore
    return t('trafficViewer.recordHistory.filter.form.labels.displayedLabels', props.modelValue.length, { count: props.modelValue.length })
})

function addLabel(): void {
    emit(
        'update:modelValue',
        [
            ...(props.modelValue.filter(label => label.name !== newLabelName.value)),
            new Label(newLabelName.value!, newLabelValue.value)
        ]
    )
    newLabelName.value = ''
    newLabelValue.value = ''
    showNewLabelForm.value = false
}

function removeLabel(name: string): void {
    emit('update:modelValue', props.modelValue.filter(label => label.name !== name))
}

function clear(): void {
    emit('update:modelValue', [])
}
</script>

<template>
    <VTextField
        :model-value="displayedLabels"
        :active="showMenu"
        :focus="showMenu"
        :label="label"
        :hint="hint"
        :hide-details="hideDetails"
    >
        <template v-if="modelValue.length > 0" #append-inner="{ isFocused }">
            <!--            todo lho fix hide icon when not focused  -->
            <VIcon v-show="isFocused" @click="clear">
                mdi-close-circle
            </VIcon>
        </template>

        <VMenu
            v-model="showMenu"
            :close-on-content-click="false"
            activator="parent"
            min-width="0"
        >
            <VSheet v-if="showMenu" elevation="6" class="label-menu">
                <VChipGroup v-if="modelValue.length > 0" column class="label-menu__labels">
                    <VChip
                        v-for="label in modelValue"
                        :key="label.name"
                        closable
                        @click:close="removeLabel(label.name)"
                    >
                        <span>{{ label.name }}</span>
                        <span class="text-disabled ml-1">{{ label.value }}</span>
                    </VChip>
                </VChipGroup>

                <VBtn
                    v-if="!showNewLabelForm"
                    prepend-icon="mdi-plus"
                    @click="showNewLabelForm = true"
                >
                    {{ t('trafficViewer.recordHistory.filter.form.labels.button.addLabel') }}
                </VBtn>
                <VForm
                    v-if="showNewLabelForm"
                    @submit="addLabel"
                    class="label-menu__add-label"
                >
                    <VAutocomplete
                        v-model="newLabelName"
                        :items="availableLabelNames"
                        :label="t('trafficViewer.recordHistory.filter.form.labels.form.newLabelName')"
                        clearable
                        @update:focused="loadLabelNames()"
                        @update:search="loadLabelNames($event)"
                    />
                    <VAutocomplete
                        v-model="newLabelValue"
                        :items="availableLabelValues"
                        :label="t('trafficViewer.recordHistory.filter.form.labels.form.newLabelValue')"
                        clearable
                        :disabled="newLabelName == undefined || newLabelName.trim().length === 0"
                        @update:search="loadLabelValues($event)"
                    />
                    <VBtn
                        type="submit"
                        :disabled="newLabelValue == undefined || newLabelValue.trim().length === 0"
                        @click="addLabel"
                    >
                        {{ t('common.button.add') }}
                    </VBtn>
                </VForm>
            </VSheet>
        </VMenu>
    </VTextField>
</template>

<style lang="scss" scoped>
.label-menu {
    padding: 1rem;
    display: flex;
    flex-direction: column;
    row-gap: 1rem;

    &__labels, &__add-label {
        min-width: 20rem;
        max-width: 30rem;
    }
}
</style>
