<script setup lang="ts">
import VueMarkdown from 'vue-markdown-render'

const props = defineProps<{
    properties: [string, any, ((item?: string) => void)?][]
}>()
</script>

<template>
    <table class="properties-table">
        <tr
            v-for="property in properties"
            :key="property[0]"
            class="properties-table__row"
        >
            <td class="text-medium-emphasis">{{ property[0] }}</td>
            <td>
                <span
                    v-if="property[1] == undefined"
                    class="text-disabled font-weight-light font-italic"
                >
                    &lt;empty&gt;
                </span>
                <VCheckbox
                    v-else-if="typeof property[1] === 'boolean'"
                    v-model="property[1]"
                    disabled
                    density="compact"
                    hide-details
                    @click="property[2]?.(undefined)"
                />
                <VChipGroup
                    v-else-if="Array.isArray(property[1])"
                    dense
                >
                    <VChip
                        v-for="item in property[1]"
                        :key="item"
                        @click="property[2]?.(item)"
                    >
                        {{ item }}
                    </VChip>
                </VChipGroup>
                <span v-else>
                    <VueMarkdown :source="property[1].toString()" />
                </span>
            </td>

        </tr>
    </table>
</template>

<style lang="scss" scoped>
.properties-table {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.5rem;

    &__row {
        display: inline-grid;
        grid-template-columns: 10rem 1fr;
        column-gap: 0.5rem;
        align-items: center;
    }
}
</style>
