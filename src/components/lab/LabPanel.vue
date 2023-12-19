<script setup lang="ts">
import {ref} from 'vue'
import {PanelType} from '@/model/lab'

const props = defineProps<{
    panel?: string
}>()

const emit = defineEmits<{
    (e: 'update:panel', value: string | null): void
}>()

const mainItems = ref([
    {
        title: 'Explorer',
        value: PanelType.Explorer,
        props: {
            prependIcon: 'mdi-connection'
        }
    }
])

function selectPanel(item: any): void {
    if (!item.value) {
        emit('update:panel', null)
    } else {
        emit('update:panel', item.id)
    }
}

</script>

<template>
    <VNavigationDrawer
        permanent
        rail
        class="bg-primary-dark"
    >
        <template #prepend>
            <div class="lab-logo">
                <!-- todo lho open info dialog -->
                <a
                    href="https://github.com/lukashornych/evitalab"
                    target="_blank"
                >
                    <VAvatar size="30px">
                        <!-- todo lho use local link, don't how to do it when we use the /lab prefix -->
                        <VImg
                            alt="evitaLab Logo"
                            width="30px"
                            height="30px"
                            src="/logo/evitalab-logo-mini.png?raw=true"
                        />
                    </VAvatar>
                </a>
            </div>
        </template>

        <VList
            density="compact"
            nav
            :items="mainItems"
            :selected="[panel]"
            @click:select="selectPanel"
            class="connection-explorer"
        />

        <template #append>
            <ul class="lab-nav-links">
                <li>
                    <a href="https://evitadb.io/documentation" target="_blank">
                        <img src="/documentation.svg" alt="evitaDB Documentation">
                        <VTooltip activator="parent">
                            evitaDB documentation
                        </VTooltip>
                    </a>
                </li>
                <li>
                    <a href="https://discord.gg/VsNBWxgmSw" target="_blank">
                        <img src="/discord.svg" alt="Discord icon">
                        <VTooltip activator="parent">
                            Discord
                        </VTooltip>
                    </a>
                </li>
                <li>
                    <a href="https://github.com/lukashornych/evitalab" target="_blank">
                    <img src="/github.svg" alt="GitHub icon">
                        <VTooltip activator="parent">
                            Give us a ⭐️ on GitHub
                        </VTooltip>
                    </a>
                </li>
            </ul>
        </template>
    </VNavigationDrawer>
</template>

<style lang="scss" scoped>
@import '@/styles/colors.scss';

.lab-logo {
    height: 3.5rem;
    display: grid;
    justify-items: center;
    align-items: center;
}
.lab-nav-links {
    display: flex;
    flex-direction: column;
    list-style: none;
    justify-content: center;
    align-items: center;
    margin: 0 0 1.25rem 0;
    gap: 1.25rem 0;
}
.lab-nav-links li img {
    opacity: .5;
    transition: opacity .2s ease-in-out;
}

.lab-nav-links li:hover img {
    opacity: 1;
}

.connection-explorer {

    & :deep(.v-list-item__underlay) {
        display: none;
    }
    & :deep(.v-list-item__overlay) {
        background: transparent;
        opacity: 1;
        border-radius: 50%;
        transition: background-color .1s ease-in-out;
    }
    & :deep(.v-list-item--active > .v-list-item__overlay) {
        background: $primary-lightest;
        opacity: 1;
        border-radius: 50%;
    }
}
</style>
