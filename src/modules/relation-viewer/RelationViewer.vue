<script setup lang="ts">
import { Cardinality } from '@/modules/database-driver/request-response/schema/Cardinality.ts'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
    cardinality: Cardinality,
    from: string,
    to: string,
}>()

const emit = defineEmits<{
    (e: 'openFrom'): void
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
</script>

<template>
    <table class="properties-table">
        <tr class="properties-table__row">
            <td>{{ t('relationViewer.title') }}</td>
            <td>
                <VChip @click="openFrom" class="clickable">{{ props.from }}</VChip>
                <VIcon :icon="icon" />
                <VChip>{{ props.to }}</VChip>
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

    &__row {
        display: inline-grid;
        grid-template-columns: 15rem 1fr;
        column-gap: 0.5rem;
        align-items: center;
    }

    &__row--dense {
        grid-template-columns: 8rem 15rem;
    }
}

.clickable:hover {
    cursor: pointer;
}
</style>
