<script setup lang="ts">

import { Connection } from '@/modules/connection/model/Connection'
import { ServerFile } from '@/modules/connection/model/server-file/ServerFile'
import { useI18n } from 'vue-i18n'
import { ref } from 'vue'
import DeleteServerFileDialog from '@/modules/server-file-viewer/component/DeleteServerFileDialog.vue'

const { t } = useI18n()

const props = defineProps<{
    connection: Connection
    file: ServerFile
}>()
const emit = defineEmits<{
    (e: 'delete'): void
}>()

const showDeleteDialog = ref<boolean>(false)
</script>

<template>
    <DeleteServerFileDialog
        v-model="showDeleteDialog"
        :connection="connection"
        :file="file"
        @delete="emit('delete')"
    >
        <template #activator="{ props }">
            <VBtn
                icon
                @click="showDeleteDialog = true"
                v-bind="props"
            >
                <VIcon>mdi-delete-outline</VIcon>

                <VTooltip activator="parent">
                    {{ t('serverFileViewer.list.item.button.deleteFile') }}
                </VTooltip>
            </VBtn>
        </template>
    </DeleteServerFileDialog>
</template>

<style lang="scss" scoped>

</style>
