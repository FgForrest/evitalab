<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ConnectionService, useConnectionService } from '@/modules/connection/service/ConnectionService'
import { Connection } from '@/modules/connection/model/Connection'
import ConnectionItem from '@/modules/connection/explorer/component/ConnectionItem.vue'
import { EvitaLabConfig, useEvitaLabConfig } from '@/modules/config/EvitaLabConfig'
import Immutable from 'immutable'
import ConnectToServerDialog from '@/modules/connection/explorer/component/ConnectToServerDialog.vue'

const evitaLabConfig: EvitaLabConfig = useEvitaLabConfig()
const connectionService: ConnectionService = useConnectionService()
const { t } = useI18n()

const props = defineProps<{
    modelValue: boolean
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
}>()

const showConnectToServerDialog = ref<boolean>(false)
const connections = computed<Immutable.List<Connection>>(() => connectionService.getConnections()
    .sort((a: Connection, b: Connection) => {
        if (a.preconfigured && !b.preconfigured) {
            return -1
        }
        if (b.preconfigured && !a.preconfigured) {
            return 1
        }
        return a.name.localeCompare(b.name)
    }))
</script>

<template>
    <VNavigationDrawer
        permanent
        :model-value="modelValue"
        :width="325"
        @update:model-value="$emit('update:modelValue', $event)"
        class="bg-primary"
    >
        <VList
            density="compact"
            nav
        >
            <VListSubheader class="text-gray-light text-sm-body-2 font-weight-medium">{{ t('explorer.title') }}</VListSubheader>

            <ConnectionItem
                v-for="connection in connections"
                :key="connection.name"
                :connection="connection"
            />
        </VList>

        <template #append>
            <div
                v-if="!evitaLabConfig.readOnly"
                class="pa-2"
            >
                <ConnectToServerDialog v-model="showConnectToServerDialog">
                    <template #activator="{ props }">
                        <VBtn
                            prepend-icon="mdi-power-plug-outline"
                            block
                            variant="outlined"
                            v-bind="props"
                            @click="showConnectToServerDialog = true"
                        >
                            {{ t('explorer.button.connect') }}
                        </VBtn>
                    </template>
                </ConnectToServerDialog>
            </div>
        </template>
    </VNavigationDrawer>
</template>

<style lang="scss" scoped>
</style>
