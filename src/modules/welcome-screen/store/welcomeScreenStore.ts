import { defineStore } from 'pinia'
import { EvitaDBBlogPost } from '@/modules/welcome-screen/model/EvitaDBBlogPost'
import { Ref, ref, shallowReadonly } from 'vue'

/**
 * Defines Pinia store for welcome screen
 */
export const useWelcomeScreenStore = defineStore('welcomeScreen', () => {
    const blogPosts: Ref<EvitaDBBlogPost[]> = ref<EvitaDBBlogPost[]>([])

    function replaceBlogPosts(newBlogPosts: EvitaDBBlogPost[]): void {
        blogPosts.value.splice(0, newBlogPosts.length)
        blogPosts.value.push(...newBlogPosts)
    }

    return {
        blogPosts: shallowReadonly(blogPosts),
        replaceBlogPosts
    }
})

export type WelcomeScreenStore = ReturnType<typeof useWelcomeScreenStore>
