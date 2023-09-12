<script setup lang="ts">
import { SchemaViewerProps } from '@/model/editor/schema-viewer'
import { ref } from 'vue'
import { SchemaViewerService, useSchemaViewerService } from '@/services/editor/schema-viewer.service'
import { Toaster, useToaster } from '@/services/editor/toaster'

const schemaViewerService: SchemaViewerService = useSchemaViewerService()
const toaster: Toaster = useToaster()

const props = defineProps<SchemaViewerProps>()

const schemaLoaded = ref<boolean>(false)
const schema = ref<any>()
schemaViewerService.getSchema(props.dataPointer)
    .catch(error => {
        toaster.error(error)
    })
    .then(s => {
        schema.value = s
        schemaLoaded.value = true
    })
</script>

<template>
    <div class="schema-viewer">
        <VToolbar
            density="compact"
            elevation="2"
            class="schema-viewer__header"
        >
            <VAppBarNavIcon
                icon="mdi-file-code"
                :disabled="true"
                style="opacity: 1"
            />

            <VToolbarTitle>
                <VBreadcrumbs
                    :items="dataPointer.schemaPointer.path()"
                    class="pl-0 pr-0"
                />
            </VToolbarTitle>
        </VToolbar>

        <VSheet class="schema-viewer__body">
            <component
                v-if="schemaLoaded"
                :is="dataPointer.schemaPointer.component()"
                :data-pointer="dataPointer"
                :schema="schema"
            />
            <span v-else>
                Loading...
            </span>
        </VSheet>
    </div>
</template>

<style lang="scss" scoped>
.schema-viewer {
    display: grid;
    grid-template-rows: 3rem 1fr;

    &__header {
        z-index: 100;
    }

    &__body {
        position: relative;
    }
}
</style>
