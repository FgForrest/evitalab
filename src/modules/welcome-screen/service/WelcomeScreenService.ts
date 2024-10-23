import { WelcomeScreenStore } from '@/modules/welcome-screen/store/welcomeScreenStore'
import { EvitaDBBlogPost } from '@/modules/welcome-screen/model/EvitaDBBlogPost'
import { EvitaDBDocsClient } from '@/modules/welcome-screen/driver/EvitaDBDocsClient'
import { InjectionKey } from 'vue'
import { mandatoryInject } from '@/utils/reactivity'

export const welcomeScreenServiceInjectionKey: InjectionKey<WelcomeScreenService> = Symbol('welcomeScreenService')

/**
 * Manager for data used on welcome screen
 */
export class WelcomeScreenService {
    private readonly store: WelcomeScreenStore
    private readonly evitaDBDocsClient: EvitaDBDocsClient

    constructor(store: WelcomeScreenStore, evitaDBDocsClient: EvitaDBDocsClient) {
        this.store = store
        this.evitaDBDocsClient = evitaDBDocsClient
    }

    /**
     * Returns the latest evitaDB blog posts to display on news page.
     */
    getBlogPosts = async (): Promise<EvitaDBBlogPost[]> => {
        let cachedBlogPosts: EvitaDBBlogPost[] | undefined = this.store.blogPosts as EvitaDBBlogPost[]
        if (cachedBlogPosts == undefined || cachedBlogPosts.length === 0) {
            cachedBlogPosts = await this.evitaDBDocsClient.getBlogPosts()
            this.store.replaceBlogPosts(cachedBlogPosts)
        }
        return cachedBlogPosts
    }
}

export const useWelcomeScreenManager = (): WelcomeScreenService => {
    return mandatoryInject(welcomeScreenServiceInjectionKey) as WelcomeScreenService
}
