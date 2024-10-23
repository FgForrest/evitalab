<script setup lang="ts">

import VListItemDivider from '@/modules/base/component/VListItemDivider.vue'
import { ServerFile } from '@/modules/connection/model/server-file/ServerFile'
import { Connection } from '@/modules/connection/model/Connection'
import ServerFileListItem from '@/modules/server-file-viewer/component/ServerFileListItem.vue'

const props = defineProps<{
    connection: Connection,
    files: ServerFile[],
    pageNumber: number,
    pageSize: number,
    pageCount: number
}>()
const emit = defineEmits<{
    (e: 'update:pageNumber', value: number): void,
    (e: 'requestTaskUpdate'): void,
    (e: 'requestFileUpdate'): void
}>()
</script>

<template>
    <VList>
        <VListSubheader v-if="$slots['subheader']">
            <slot name="subheader" />
        </VListSubheader>

        <VDataIterator
            :items="files"
            :page="pageNumber"
            :items-per-page="pageSize"
        >
            <template #default="{ items }">
                <template v-for="(item, index) in items" :key="item.raw.fileId.code">
                    <ServerFileListItem
                        :connection="connection"
                        :file="item.raw"
                        @request-task-update="emit('requestTaskUpdate')"
                        @request-file-update="emit('requestFileUpdate')"
                    >
                        <template #append="{ file }">
                            <slot name="item-append" :file="file" />
                        </template>
                    </ServerFileListItem>

                    <VListItemDivider
                        v-if="index < files.length - 1"
                        inset
                    />
                </template>
            </template>

            <template #footer>
                <VPagination
                    :model-value="pageNumber"
                    :length="pageCount"
                    @update:model-value="emit('update:pageNumber', $event)"
                />
            </template>
        </VDataIterator>
    </VList>
</template>

<style lang="scss" scoped>

</style>
