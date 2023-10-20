import { EvitaDBBlogPost } from '@/model/lab'
import { ApiClient } from '@/services/api-client'

/**
 * HTTP client for evitaDB docs website. Should not be used directly in components, instead it should be used as a low level
 * abstraction of raw HTTP API.
 */
export class EvitaDBDocsClient extends ApiClient {

    async getBlogPosts(): Promise<EvitaDBBlogPost[]> {
        try {
            const rssResponse: string = await this.httpClient.get('https://evitadb.io/rss.xml').text()
            const rss: Document = new window.DOMParser().parseFromString(rssResponse, 'text/xml')

            const items: NodeListOf<Element> | undefined = rss.querySelector('channel')?.querySelectorAll('item')
            if (items == undefined) {
                console.log('No evitaDB blog posts found in RSS feed.')
                return []
            }

            const blogPosts: EvitaDBBlogPost[] = []
            items.forEach((item: Element) => {
                blogPosts.push({
                    title: item.querySelector('title')?.textContent ?? '',
                    perex: item.querySelector('description')?.textContent ?? '',
                    url: item.querySelector('link')?.textContent ?? '',
                    thumbnailUrl: item.querySelector('enclosure')?.getAttribute('url') ?? ''
                })
            })
            // we need only 2 latest blog posts
            blogPosts.reverse().splice(2)
            return blogPosts
        } catch (e: any) {
            throw this.handleCallError(e, undefined)
        }
    }
}
