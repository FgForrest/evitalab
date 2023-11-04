<script setup lang="ts">
import { EntityPropertyKey } from '@/model/editor/data-grid'
import VMarkdown from '@/components/base/VMarkdown.vue'

const props = withDefaults(defineProps<{
    value: EntityPropertyKey,
    title: string,
    description?: string,
    flags?: string[],
    openable: boolean,
}>(), {
    description: undefined,
    openable: false,
    flags: () => []
})
const emit = defineEmits<{
    (e: 'schemaOpen'): void
}>()

</script>

<template>
    <VListItem :value="value">
        <template v-slot:prepend="{ isActive }">
            <VListItemAction start>
                <VCheckboxBtn :model-value="isActive" />
            </VListItemAction>
        </template>

        <template #title>
            <div class="item-title">
                <span> {{ title }}</span>

                <VChipGroup v-if="flags">
                    <VChip
                        v-for="flag in flags"
                        :key="flag"
                        class="text-sm-body-2"
                    >
                        {{ flag }}
                    </VChip>
                </VChipGroup>
            </div>
        </template>

        <template
            v-if="description || false"
            #subtitle
        >
             <div class="item-description">
                {{ description }}
                 <VTooltip
                     activator="parent"
                     max-width="500"
                 >
                     <VMarkdown :source="description" />
                 </VTooltip>
             </div>
        </template>

        <template
            v-if="openable"
            #append
        >
            <VBtn
                icon
                variant="text"
                @click.stop="emit('schemaOpen')"
            >
                <VIcon>mdi-open-in-new</VIcon>
                <VTooltip activator="parent">
                    Open schema
                </VTooltip>
            </VBtn>
        </template>
    </VListItem>
</template>

<style lang="scss" scoped>
.item-title {
    display: flex;
    gap: 1rem;
    align-items: center;
    height: 1.875rem; // derived from chip group height
}

.item-description {
    margin-top: 0.25rem; // derived from chip group margin
}
</style>
