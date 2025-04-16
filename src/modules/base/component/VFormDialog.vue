<script setup lang="ts">

/**
 * Variant of dialog with form.
 */

import VLabDialog from '@/modules/base/component/VLabDialog.vue'
import VRejectDialogButton from '@/modules/base/component/VRejectDialogButton.vue'
import VConfirmDialogButton from '@/modules/base/component/VConfirmDialogButton.vue'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = withDefaults(
    defineProps<{
        modelValue: boolean,
        changed?: boolean,
        dangerous?: boolean,
        scrollable?: boolean,
        confirmButtonIcon?: string,
        confirm: () => Promise<boolean>,
        reset?: () => void,
        maxWidth?: string
    }>(),
    {
        changed: false,
        scrollable: false,
        dangerous: false,
        confirmButtonIcon: 'mdi-check',
        reset: () => {}
    }
)
const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
}>()

const form = ref<HTMLFormElement | null>(null)
const formValidationState = ref<boolean | null>(null)
const submitting = ref<boolean>(false)

function cancel(): void {
    if (form.value != undefined) {
        //@ts-ignore
        form.value.reset()
    }
    props.reset()
    emit('update:modelValue', false)
}

async function confirm(): Promise<void> {
    if (form.value != undefined) {
        //@ts-ignore
        const { valid }: any = await form.value.validate()
        if (!valid) {
            return
        }
    }

    submitting.value = true
    const result: boolean = await props.confirm()
    submitting.value = false

    if (result) {
        if (form.value != undefined) {
            //@ts-ignore
            form.value.reset()
        }
        props.reset()
        emit('update:modelValue', false)
    }
}

defineExpose<{
    validateForm: () => Promise<void>
}>({
    validateForm: async () => {
        //@ts-ignore
        await form.value?.validate()
    },
})
</script>

<template>
    <VLabDialog
        :model-value="modelValue"
        :max-width="maxWidth"
        :scrollable="scrollable"
        persistent
    >
        <template #activator="{ props }">
            <slot name="activator" v-bind="{ props }"/>
        </template>

        <template #title>
            <slot name="title" />
        </template>

        <template #default>
            <div v-if="$slots['prepend-form']" class="mb-4">
                <slot name="prepend-form" />
            </div>

            <VForm
                v-if="$slots['default']"
                v-model="formValidationState"
                ref="form"
                validate-on="blur"
            >
                <slot />
            </VForm>

            <div v-if="$slots['append-form']" class="mt-4">
                <slot name="append-form" />
            </div>
        </template>

        <template #alternative-action-button>
            <slot name="alternative-action-button" />
        </template>
        <template #reject-button>
            <VRejectDialogButton @reject="cancel">
                {{ t('common.button.cancel') }}
            </VRejectDialogButton>
        </template>
        <template #confirm-button>
            <VConfirmDialogButton
                :icon="confirmButtonIcon"
                :dangerous="dangerous"
                :disabled="formValidationState === false || !changed"
                :loading="submitting"
                @confirm="confirm"
            >
                <slot name="confirm-button-body">
                    {{ t('common.button.confirm') }}
                </slot>
            </VConfirmDialogButton>
        </template>
    </VLabDialog>
</template>

<style lang="scss" scoped>

</style>
