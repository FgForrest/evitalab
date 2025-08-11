<script setup lang="ts">
import { Cardinality } from '@/modules/database-driver/request-response/schema/Cardinality.ts'
import { useI18n } from 'vue-i18n'
import { useWorkspaceService, WorkspaceService } from '@/modules/workspace/service/WorkspaceService.ts'
import { EntitySchemaPointer } from '@/modules/schema-viewer/viewer/model/EntitySchemaPointer.ts'
import { SchemaViewerDataPointer } from '@/modules/schema-viewer/viewer/model/SchemaViewerDataPointer.ts'
import { ReferenceSchema } from '@/modules/database-driver/request-response/schema/ReferenceSchema.ts'
import { ReferenceSchemaPointer } from '@/modules/schema-viewer/viewer/model/ReferenceSchemaPointer.ts'
import {
    SchemaViewerTabFactory,
    useSchemaViewerTabFactory
} from '@/modules/schema-viewer/viewer/workspace/service/SchemaViewerTabFactory.ts'

const workspaceService: WorkspaceService = useWorkspaceService()
const schemaViewerTabFactory: SchemaViewerTabFactory = useSchemaViewerTabFactory()

const props = defineProps<{
    dataPointer: SchemaViewerDataPointer,
    schema: ReferenceSchema,
    referenceSchemaPointer: ReferenceSchemaPointer,
}>()

const emit = defineEmits<{
    (e: 'openFrom'): void,
    (e: 'openTo'): void,
}>()

const { t } = useI18n()

const icon = computed(() => {
    switch (props.schema.cardinality) {
        case Cardinality.ExactlyOne:
            return 'mdi-relation-one-to-one'
        case Cardinality.OneOrMore:
            return 'mdi-relation-one-to-one-or-many'
        case Cardinality.ZeroOrOne:
            return 'mdi-relation-one-to-zero-or-one'
        case Cardinality.ZeroOrMore:
            return 'mdi-relation-one-to-zero-or-many'
    }
})


function openFrom(): void {
    workspaceService.createTab(schemaViewerTabFactory.createNew(
        new EntitySchemaPointer(
            props.dataPointer.schemaPointer.catalogName,
            props.referenceSchemaPointer.entityType
        )
    ))
}

function openTo(): void {
    workspaceService.createTab(schemaViewerTabFactory.createNew(
        new EntitySchemaPointer(
            props.dataPointer.schemaPointer.catalogName,
            props.schema.entityType
        )
    ))
}
</script>

<template>
    <table class="properties-table">
        <tr class="properties-table__row">
            <td>{{ t('relationViewer.title') }}</td>
            <td class="content-row">
                <VChip @click="openFrom"
                       variant="outlined"
                       class="clickable" dense>
                    {{ referenceSchemaPointer.entityType }}
                    <VTooltip activator="parent">
                        {{ t('relationViewer.managedByEvita') }}
                    </VTooltip>
                </VChip>
                <div>
                    <VIcon class="icon" :icon="icon" />
                    <VTooltip activator="parent">
                        {{ t(`relationViewer.cardinality.${schema.cardinality}`) }}
                    </VTooltip>
                </div>
                <VChip @click="schema.referencedEntityTypeManaged ? openTo() : null"
                       :variant="schema.referencedEntityTypeManaged ? 'outlined' : 'plain'"
                       :class="schema.referencedEntityTypeManaged ? 'clickable' : ''" dense>
                    {{ schema.entityType }}
                    <VTooltip activator="parent" v-if="schema.referencedEntityTypeManaged">
                        {{ t('relationViewer.managedByEvita') }}
                    </VTooltip>
                    <VTooltip activator="parent" v-else>
                        {{ t('relationViewer.managedExternal') }}
                    </VTooltip>
                </VChip>
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

    .content-row {
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
