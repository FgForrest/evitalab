<script setup lang="ts">
import { Cardinality } from '@/modules/database-driver/request-response/schema/Cardinality.ts'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
    cardinality: Cardinality,
    from: string,
    to: string,
}>()

const emit = defineEmits<{
    (e: 'openFrom'): void,
    (e: 'openTo'): void,
}>()

const { t } = useI18n()

const icon = computed(() => {
    switch (props.cardinality) {
        case Cardinality.ExactlyOne:
            return "mdi-relation-one-to-one"
        case Cardinality.OneOrMore:
            return "mdi-relation-one-to-one-or-many"
        case Cardinality.ZeroOrOne:
            return "mdi-relation-one-to-zero-or-one"
        case Cardinality.ZeroOrMore:
            return "mdi-relation-one-to-zero-or-many"
    }
})


function openFrom(): void {
    emit('openFrom')
}

function openTo(): void {
    emit('openTo')
}
</script>

<template>
    <table class="properties-table">
        <tr class="properties-table__row">
            <td>{{ t('relationViewer.title') }}</td>
            <td class="content-row">
                <VChip @click="openFrom" variant="outlined" class="clickable">{{ props.from }}</VChip>
                <div>
                    <VIcon class="icon" :icon="icon" />
                    <VTooltip activator="parent">
                        {{ t(`relationViewer.cardinality.${cardinality}`) }}
                    </VTooltip>
                </div>
                <VChip @click="openTo" variant="outlined" class="clickable">{{ props.to }}</VChip>
            </td>
        </tr>
    </table>
</template>

<style scoped lang="scss">
.properties-table {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.5rem;
    color: #FFFFFFB3;

    &__row {
        display: inline-grid;
        grid-template-columns: 15rem 1fr;
        column-gap: 0.5rem;
        align-items: center;
    }

    &__row--dense {
        grid-template-columns: 8rem 15rem;
    }

    .content-row{
        width: 50%;
        display: flex;
        flex-direction: row;
    }
}

.icon {
    padding: 1rem;
}

.clickable:hover {
    cursor: pointer;
}
</style>
