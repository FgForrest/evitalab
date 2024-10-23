<script setup lang="ts">
/**
 * Custom button for confirming dialogs
 */

import { DangerousConfirmType } from '@/modules/base/model/dialog/DangerousConfirmType'
import VConfirmDialog from '@/modules/base/component/VConfirmDialog.vue'
import { computed, ref } from 'vue'

const props = withDefaults(
    defineProps<{
        icon: string,
        disabled?: boolean,
        loading?: boolean,
        dangerous?: boolean | DangerousConfirmType
    }>(),
    {
        disabled: false,
        loading: false,
        dangerous: false
    }
)
const emit = defineEmits<{
    (e: 'confirm'): void,
    (e: 'reject'): void
}>()

const showConfirmDialog = ref<boolean>(false)

const shouldLookDangerous = computed<boolean>(() => {
    return props.dangerous === true ||
        props.dangerous === DangerousConfirmType.WithConfirmDialog ||
        props.dangerous === DangerousConfirmType.WithoutConfirmDialog
})

function tryConfirm(): void {
    if (props.dangerous === true || props.dangerous === DangerousConfirmType.WithConfirmDialog) {
        showConfirmDialog.value = true
    } else {
        emit('confirm')
    }
}
</script>

<template>
    <VBtn
        variant="outlined"
        :prepend-icon="icon"
        :color="shouldLookDangerous ? 'error' : undefined"
        :disabled="disabled"
        :loading="loading"
        @click="tryConfirm"
        :class="['ml-4', { 'confirm-button--dangerous': shouldLookDangerous }]"
    >
        <slot />

        <VConfirmDialog
            v-model="showConfirmDialog"
            :confirm-icon="icon"
            @confirm="emit('confirm')"
            @reject="emit('reject')"
        >
            <template #title>
                <slot name="confirm-dialog-title" />
            </template>
            <template #message>
                <slot name="confirm-dialog-message" />
            </template>
            <template #confirm-button-title>
                <slot />
            </template>
        </VConfirmDialog>
    </VBtn>
</template>

<style lang="scss" scoped>
@import "@/styles/colors.scss";
.confirm-button--dangerous {
    border-color: rgba($error, .5) !important;

    &:hover {
        border-color: $error !important;
    }
}
</style>
