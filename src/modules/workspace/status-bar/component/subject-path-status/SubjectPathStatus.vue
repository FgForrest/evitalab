<script setup lang="ts">

/**
 * Render the status info of an active user-resource path.
 */

import { SubjectPathStatus } from '@/modules/workspace/status-bar/model/subject-path-status/SubjectPathStatus'
import { computed } from 'vue'
import { SubjectPath } from '@/modules/workspace/status-bar/model/subject-path-status/SubjectPath'
import SubjectPathStatusItem from '@/modules/workspace/status-bar/component/subject-path-status/SubjectPathStatusItem.vue'
import SubjectPathStatusItemDelimiter from '@/modules/workspace/status-bar/component/subject-path-status/SubjectPathStatusItemDelimiter.vue'

const props = defineProps<{
    status: SubjectPathStatus
}>()

const activatedPath = computed<SubjectPath | undefined>(() =>
    props.status.activatedPath)
</script>

<template>
    <div v-if="activatedPath" class="subject-path-status">
        <template v-for="(item, index) in activatedPath.items" :key="index">
            <SubjectPathStatusItem :item="item" />
            <SubjectPathStatusItemDelimiter v-if="(index + 1) < activatedPath.items.size" />
        </template>
    </div>
</template>

<style lang="scss" scoped>
.subject-path-status {
    display: flex;
    align-items: center;
}
</style>
