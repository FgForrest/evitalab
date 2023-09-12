<script setup lang="ts">
import { ref } from 'vue'
import { PanelType } from '@/model/lab'

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
            prependIcon: 'mdi-compass'
        }
    }
])
const secondaryItems = ref([
    {
        title: 'evitaDB Documentation',
        value: PanelType.EvitaDBDocumentation,
        props: {
            prependIcon: 'mdi-book',
        }
    },
    {
        title: 'Feedback',
        value: PanelType.Feedback,
        props: {
            prependIcon: 'mdi-comment-quote',
        }
    },
    {
        title: 'Issues',
        value: PanelType.GitHub,
        props: {
            prependIcon: 'mdi-github',
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

function openItem(item: any): void {
    switch (item.id) {
        case PanelType.EvitaDBDocumentation:
            window.open('https://evitadb.io/documentation', '_blank')
            break
        case PanelType.Feedback:
            window.open('https://discord.gg/VsNBWxgmSw', '_blank')
            break
        case PanelType.GitHub:
            window.open('https://github.com/lukashornych/evitalab', '_blank')
            break
    }
}
</script>

<template>
    <VNavigationDrawer
        permanent
        rail
    >
        <template #prepend>
            <div class="lab-logo">
                <!-- todo lho open info dialog -->
                <a
                    href="https://github.com/lukashornych/evitalab"
                    target="_blank"
                >
                    <VAvatar size="24px">
                        <!-- todo lho use local link, don't how to do it when we use the /lab prefix -->
                        <VImg
                            alt="evitaLab Logo"
                            src="https://github.com/lukashornych/evitalab/blob/dev/public/logo.png?raw=true"
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
        />

        <template #append>
            <VList
                density="compact"
                nav
                :items="secondaryItems"
                @click:select="openItem"
            />
        </template>
    </VNavigationDrawer>
</template>

<style scoped>
.lab-logo {
    height: 3.5rem;
    display: grid;
    justify-items: center;
    align-items: center;
}
</style>
