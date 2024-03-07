<script setup lang="ts">
import { ref } from 'vue'
import LabEditorTabLoadingScreen from '@/components/lab/editor/tab/LabEditorTabLoadingScreen.vue'
import { TabRequestComponentData } from '@/model/editor/tab/TabRequestComponentData'

const props = defineProps<{
    component: any,
    componentProps: any
}>()
const emit = defineEmits<{
    (e: 'dataUpdate', value: TabRequestComponentData<any>): void
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
    <LabEditorTabLoadingScreen v-if="!componentReady" />
</template>

<style lang="scss" scoped>

</style>
