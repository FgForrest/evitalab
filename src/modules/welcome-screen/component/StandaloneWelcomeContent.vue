<script setup lang="ts">

import VMarkdown from '@/modules/base/component/VMarkdown.vue'
import { ref } from 'vue'
import { EvitaDBBlogPost } from '@/modules/welcome-screen/model/EvitaDBBlogPost'
import { useWelcomeScreenManager, WelcomeScreenService } from '@/modules/welcome-screen/service/WelcomeScreenService'
import { useI18n } from 'vue-i18n'

const welcomeScreenManager: WelcomeScreenService = useWelcomeScreenManager()
const { t } = useI18n()

const props = defineProps<{
    version: string
}>()

const blogPosts = ref<EvitaDBBlogPost[]>([])

welcomeScreenManager.getBlogPosts().then((posts) => {
    blogPosts.value = posts
})
</script>

<template>
    <div class="editor-welcome-screen">
        <div class="editor-welcome-screen-hero">
            <header class="editor-welcome-screen-hero__header">
                <VImg
                    width="240"
                    height="240"
                    max-width="240"
                    max-height="240"
                    alt="evitaLab Logo"
                    src="/logo/evitalab-logo-representative.svg"
                    class="evitalab-logo"
                />
                <div class="editor-welcome-screen-hero__title">
                    <h1 class="font-weight-bold mb-2" style="font-size: 4.375rem;">{{ t('app.name') }}</h1>
                    <p class="text-white" style="font-size: 1rem;">{{ version }} <a
                        class="text-primary-lightest text-body-2" href="https://github.com/lukashornych/evitalab/releases"
                        target="_blank">({{ t('welcomeScreen.standalone.changelog') }})</a></p>
                    <p class="text-gray-light" style="font-size: 1rem;">{{ t('welcomeScreen.standalone.description') }}</p>
                </div>
            </header>

            <div class="editor-welcome-screen-blog">
                <a
                    v-for="blogPost in blogPosts"
                    :key="blogPost.url"
                    :href="blogPost.url"
                    target="_blank"
                >
                    <span class="editor-welcome-screen-blog-img__wrap">
                        <img
                            class="Blog_BlogMotive__72hVr"
                            height="160"
                            width="480"
                            :src="blogPost.thumbnailUrl"
                            :alt="t('welcomeScreen.standalone.blog.thumbnail.alt', { title: blogPost.title })"
                        />
                    </span>
                    <span class="editor-welcome-screen-blog-item__title">
                        {{ blogPost.title }}
                    </span>
                    <span class="editor-welcome-screen-blog-item__perex">
                        <VMarkdown :source="blogPost.perex" />
                    </span>
                    <span class="editor-welcome-screen-blog-item__btn">{{ t('welcomeScreen.standalone.blog.button.read') }}</span>
                </a>
            </div>

            <span class="editor-welcome-screen-hr">&nbsp;</span>

            <ul class="editor-welcome-screen-hero__links">
                <I18nT keypath="welcomeScreen.standalone.link.evitaDBDocumentation.text" tag="li">
                    <template #link>
                        <a href="https://evitadb.io/documentation" target="_blank">{{ t('welcomeScreen.standalone.link.evitaDBDocumentation.link') }}</a>
                    </template>
                </I18nT>
                <I18nT keypath="welcomeScreen.standalone.link.evitaLabGitHub.text" tag="li">
                    <template #link>
                        <a href="https://github.com/lukashornych/evitalab/" target="_blank">{{ t('welcomeScreen.standalone.link.evitaLabGitHub.link') }}</a>
                    </template>
                </I18nT>
                <I18nT keypath="welcomeScreen.standalone.link.discord.text" tag="li">
                    <template #link>
                        <a href="https://discord.gg/VsNBWxgmSw" target="_blank">{{ t('welcomeScreen.standalone.link.discord.link') }}</a>
                    </template>
                </I18nT>
                <li>
                    <a href="https://github.com/lukashornych/evitalab/issues" target="_blank">
                        {{ t('welcomeScreen.standalone.link.submitIssue') }}
                    </a>
                </li>
            </ul>
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
    justify-items: center;
    align-items: center;
}

.editor-welcome-screen-hero {
    display: flex;
    flex-direction: column;
    width: 100%;
    padding: 0 2rem;
    height: 100%;
    overflow: auto;

    @media (min-width: 97.5rem) {
        padding: 0 8rem;
    }

    &__header {
        text-align: center;
    }

    &__links {
        margin-top: 2.5rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }
}

.editor-welcome-screen-hero__header {
    flex: 1;
    padding-top: 12vh;
    margin-bottom: 3.5rem;

    @media (min-width: 83.125rem) {
        display: flex;
        justify-content: center;
        align-items: center;
        column-gap: 2.5rem;
    }
}

.editor-welcome-screen-hero__title {
    @media (min-width: 83.125rem) {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: flex-start;
        gap: 0.5rem;
    }
}

.editor-welcome-screen-blog {
    display: flex;
    flex-wrap: wrap;
    width: 100%;
    justify-content: center;
    margin: auto auto 1.875rem auto;
    gap: 1.25rem;

    @media (min-width: 1440px) {
        gap: 3rem;
    }

    a {
        text-decoration: none;
        max-width: 28.75rem;
        display: flex;
        align-items: center;
        flex-direction: column;
        color: white;

        &:hover {
            color: white;
            text-decoration: none;

            img {
                scale: 1.05;
            }

            .editor-welcome-screen-blog-item__btn {
                border-color: $white;
            }
        }
    }

    img {
        max-width: 100%;
        height: auto;
        transition: all .2s linear;
        transform-origin: center center;
    }

}

.editor-welcome-screen-blog-img__wrap {
    display: flex;
    overflow: hidden;
    margin-bottom: 0.625rem;
}

.editor-welcome-screen-blog-item__title {
    color: white;
    margin-bottom: 1rem;
    display: block;
    width: 100%;
    font-size: 22px;
    line-height: 29px;
    font-weight: 500;
    padding: 0 15px;
}

.editor-welcome-screen-blog-item__perex {
    margin-bottom: 1.5rem;
    --tw-text-opacity: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    line-height: 1.7;
    max-height: 5.1;
    padding: 0 15px;
    font-weight: normal;
}

.editor-welcome-screen-blog-item__btn {
    margin-right: auto;
    margin-left: 15px;
    border: 1px solid rgba($white, .5);
    margin-top: auto;
    display: inline-block;
    font-weight: 500;
    position: relative;
    align-items: center;
    overflow: hidden;
    padding: 12px 16px;
    font-size: 14px;
    line-height: 1;
    height: 40px;
    border-radius: 20px;
    text-decoration: none;
    transition: all .4s linear;
}

.editor-welcome-screen-hr {
    height: 0.0625rem;
    background: #4F4F4F;
    margin-top: 1.875rem;
}

.editor-welcome-screen-hero__links {
    margin: 0 auto;
    padding: 1.875rem 0;
    max-width: 42.1875rem;
    display: block;
    list-style: none;
    text-align: center;

    li {
        display: inline-flex;
        margin: 0.5rem 0;
        font-size: 1rem;

        + li {
            margin-left: 1.875rem;
        }
    }

    a {
        margin-left: 0.5rem;
        color: $primary-lightest;
        transition: all .2s linear;

        &:hover {
            color: white;
        }
    }
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

    margin: auto;

    @media (min-width: 83.125rem) {
        margin: 0;
    }
}
</style>
