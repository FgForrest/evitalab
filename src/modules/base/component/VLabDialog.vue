<script setup lang="ts">/**
 * Custom base dialog component for all evitaLab dialogs
 */
import VCardTitleWithActions from '@/modules/base/component/VCardTitleWithActions.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = withDefaults(
    defineProps<{
        modelValue: boolean,
        maxWidth?: string | number,
        persistent?: boolean,
        scrollable?: boolean
    }>(),
    {
        maxWidth: '36rem',
        persistent: false,
        scrollable: false
    }
)
const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
}>()
</script>

<template>
    <VDialog
        :model-value="modelValue"
        :max-width="maxWidth"
        :persistent="persistent"
        :scrollable="scrollable"
        @update:model-value="emit('update:modelValue', $event)"
    >
        <template #activator="{ props }">
            <slot name="activator" v-bind="{ props }"/>
        </template>

        <VCard class="dialog-content">
            <VCardTitleWithActions>
                <template #default>
                    <slot name="title" />
                </template>

                <template #actions>
                    <slot name="title-actions">
                        <VBtn
                            v-if="!persistent"
                            icon
                            variant="flat"
                            density="compact"
                            @click="emit('update:modelValue', false)"
                        >
                            <VIcon>mdi-close</VIcon>
                            <VTooltip activator="parent">
                                {{ t('common.button.close') }}
                            </VTooltip>
                        </VBtn>
                    </slot>
                </template>
            </VCardTitleWithActions>

            <VCardText>
                <slot />
            </VCardText>

            <VCardActions v-if="$slots['alternative-action-button'] || $slots['reject-button'] || $slots['confirm-button']">
                <slot name="alternative-action-button" />
                <VSpacer />
                <slot name="reject-button" />
                <slot name="confirm-button" />
            </VCardActions>
        </VCard>
    </VDialog>
</template>

<style lang="scss" scoped>
.dialog-content {
    padding: 2rem 1rem;
}
</style>
