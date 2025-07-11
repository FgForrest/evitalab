import { defineStore } from 'pinia'
import type { EvitaDBBlogPost } from '@/modules/welcome-screen/model/EvitaDBBlogPost'
import { ref, shallowReadonly } from 'vue'
import type { Ref } from 'vue'

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
