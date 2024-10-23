<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { List } from 'immutable'

const { t } = useI18n()

const props = withDefaults(defineProps<{
    name: string,
    deprecated?: boolean,
    flags?: List<string>,
    openable?: boolean
}>(), {
    deprecated: false,
    flags: () => List(),
    openable: true
})

const emit = defineEmits<{
    (e: 'open'): void
}>()

function open() {
    if (!props.openable) {
        return
    }
    emit('open')
}
</script>

<template>
    <VListItem
        class="rounded"
        :disabled="!openable"
        @click="open"
    >
        <div class="item-body">
            <VListItemTitle>
                <span :class="['mr-5', { 'text-decoration-line-through': deprecated }]">
                    {{ name }}
                </span>
            </VListItemTitle>
            <VChipGroup>
                <VChip v-for="flag in flags" :key="flag">
                    {{ flag.startsWith('_') ? t(`schemaViewer.section.flag.${flag.substring(1)}`) : flag }}
                </VChip>
            </VChipGroup>
        </div>

        <template
            v-if="openable"
            #append
        >
            <VIcon>mdi-open-in-new</VIcon>
        </template>
    </VListItem>
</template>

<style lang="scss" scoped>
.item-body {
    display: flex;
    align-items: center;
}
</style>
