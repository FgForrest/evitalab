<script setup lang="ts">
import { ref } from 'vue'
import { TabData } from '@/modules/workspace/tab/model/TabData'
import TabLoadingScreen from '@/modules/workspace/tab/component/TabLoadingScreen.vue'

const props = defineProps<{
    component: any,
    componentProps: any
}>()
const emit = defineEmits<{
    (e: 'dataUpdate', value: TabData<any>): void
}>()

const componentReady = ref<boolean>(false)
</script>

<template>
    <KeepAlive>
        <Component
            v-show="componentReady"
            :is="component"
            v-bind="componentProps"
            @ready="componentReady = true"
            @data-update="emit('dataUpdate', $event)"
        />
    </KeepAlive>
    <TabLoadingScreen v-if="!componentReady" />
</template>

<style lang="scss" scoped>

</style>
