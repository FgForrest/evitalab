<script setup lang="ts">

import Immutable from 'immutable'
import ApiInfoListItem from '@/modules/server-viewer/component/server-status/ApiInfoListItem.vue'
import { ApiType } from '@/modules/database-driver/request-response/status/ApiType'
import { ApiStatus } from '@/modules/database-driver/request-response/status/ApiStatus'

const props = defineProps<{
    apis: Immutable.Map<ApiType, ApiStatus>
}>()
</script>

<template>
    <div class="api-info-list">
        <ApiInfoListItem
            v-for="apiType in apis.keys()"
            :key="apiType"
            :api-type="apiType"
            :api-status="apis.get(apiType)!"
        />
    </div>
</template>

<style lang="scss" scoped>
.api-info-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}
</style>
