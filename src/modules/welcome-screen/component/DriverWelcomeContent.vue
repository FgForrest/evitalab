<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { computed } from 'vue'
import { ConnectionService, useConnectionService } from '@/modules/connection/service/ConnectionService'

const connectionService: ConnectionService = useConnectionService()
const { t } = useI18n()

const props = defineProps<{
    version: string
}>()

const connectionName = computed<string>(() => {
    return connectionService.getDriverConnection().name
})

const test = localStorage.getItem('test')
</script>

<template>
    <div class="editor-welcome-screen">
        <div class="editor-welcome-screen-hero">
            <header class="editor-welcome-screen-hero__header">
                <VImg
                    width="60"
                    height="60"
                    max-width="60"
                    max-height="60"
                    alt="evitaLab Logo"
                    src="/logo/evitalab-logo-representative.svg"
                    class="evitalab-logo"
                />
                <div class="editor-welcome-screen-hero__title">
                    {{test}}
                    <h1 class="font-weight-light mb-2" style="font-size: 2rem;">
                        Connected to: <span class="font-weight-bold">{{ connectionName }}</span>
                    </h1>
                    <p class="text-white" style="font-size: 1rem;">{{ t('welcomeScreen.driver.description') }} {{ version }} <a
                        class="text-primary-lightest text-body-2" href="https://github.com/lukashornych/evitalab/releases"
                        target="_blank">({{ t('welcomeScreen.driver.changelog') }})</a></p>
                </div>
            </header>
        </div>
    </div>
</template>

<style lang="scss" scoped>
@import "@/styles/colors.scss";

.editor-welcome-screen {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    display: grid;
    justify-items: start;
    align-items: center;
}

.editor-welcome-screen-hero {
    display: flex;
    flex-direction: column;
    width: 100%;
    padding: 4rem;
    height: 100%;
    overflow: auto;

    &__header {
        text-align: center;
    }
}

.editor-welcome-screen-hero__header {
    flex: 1;
    margin-bottom: 3.5rem;
    display: flex;
    justify-content: flex-start;
    align-items: flex-start;
    column-gap: 1.5rem;
}

.editor-welcome-screen-hero__title {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
}

@-webkit-keyframes fade-in-fwd {
    0% {
        -webkit-transform: translateZ(-5rem);
        transform: translateZ(-5rem);
        opacity: 0;
    }
    100% {
        -webkit-transform: translateZ(0);
        transform: translateZ(0);
        opacity: 1;
    }
}

@keyframes fade-in-fwd {
    0% {
        -webkit-transform: translateZ(-5rem);
        transform: translateZ(-5rem);
        opacity: 0;
    }
    100% {
        -webkit-transform: translateZ(0);
        transform: translateZ(0);
        opacity: 1;
    }
}

.evitalab-logo {
    -webkit-animation: fade-in-fwd 2s cubic-bezier(0.390, 0.575, 0.565, 1.000) both;
    animation: fade-in-fwd 2s cubic-bezier(0.390, 0.575, 0.565, 1.000) both;

    margin: 0;
}
</style>
