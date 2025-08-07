<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { List } from 'immutable'
import type { Flag } from '@/modules/schema-viewer/viewer/model/Flag.ts'
import { EntityScope, EntityScopeIcons } from '@/modules/database-driver/request-response/schema/EntityScope.ts'

const { t } = useI18n()

const props = withDefaults(defineProps<{
    entitySchema?: string,
    name: string,
    deprecated?: boolean,
    flags?: List<Flag>,
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
                <span v-if="entitySchema">
                    {{ entitySchema }} >
                </span>
                <span :class="['mr-5', { 'text-decoration-line-through': deprecated }]">
                    {{ name }}
                </span>
            </VListItemTitle>
            <VChipGroup>
                <VChip v-for="flag in flags" :key="flag.flag">
                    {{ flag.flag.startsWith('_') ? t(`schemaViewer.section.flag.${flag.flag.substring(1)}`) : flag.flag
                    }}
                    <template #append>
                        <VIcon v-for="(item, index) in flag.icons"
                               class="chip-icon"
                               :key="index">
                            {{ EntityScopeIcons[item as EntityScope] }}
                        </VIcon>
                    </template>
                    <VTooltip activator="parent" v-if="flag.tooltip">
                        {{ flag.tooltip }}
                    </VTooltip>
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

.clickable:hover {
    cursor: pointer;
}

.chip-icon {
    margin-left: 4px;
    margin-right: 3px;
}

.chip-icon:last-child {
    margin-right: 8px;
}
</style>
