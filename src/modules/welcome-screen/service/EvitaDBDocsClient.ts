import { EvitaDBBlogPost } from '@/modules/welcome-screen/model/EvitaDBBlogPost'
import { EvitaLabConfig } from '@/modules/config/EvitaLabConfig'
import { KyInstance } from 'ky/distribution/types/ky'
import ky from 'ky'
import { Connection } from '@/modules/connection/model/Connection'
import { LabError } from '@/modules/base/exception/LabError'
import { EvitaDBInstanceServerError } from '@/modules/database-driver/exception/EvitaDBInstanceServerError'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { TimeoutError } from '@/modules/database-driver/exception/TimeoutError'
import { EvitaDBInstanceNetworkError } from '@/modules/database-driver/exception/EvitaDBInstanceNetworkError'

/**
 * HTTP client for evitaDB docs website. Should not be used directly in components, instead it should be used as a low level
 * abstraction of raw HTTP API.
 */
export class EvitaDBDocsClient {

    protected readonly httpClient: KyInstance
    protected readonly evitaLabConfig: EvitaLabConfig

    constructor(evitaLabConfig: EvitaLabConfig) {
        this.httpClient = ky.create({
            timeout: 300000 // 5 minutes
        })
        this.evitaLabConfig = evitaLabConfig
    }

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

    /**
     * Resolves value for header 'X-EvitaDB-ClientID' used to identify evitaLab in tracing
     * @protected
     */
    protected getClientIdHeaderValue(): string {
        return 'evitaLab-' + encodeURIComponent(this.evitaLabConfig.serverName)
    }

    /**
     * Translates HTTP errors into specific lab errors.
     */
    protected handleCallError(e: any, connection?: Connection): LabError {
        if (e.name === 'HTTPError') {
            const statusCode: number = e.response.status
            if (statusCode >= 500) {
                return new EvitaDBInstanceServerError(connection)
            } else {
                return new UnexpectedError(e.message)
            }
        } else if (e.name === 'TimeoutError') {
            return new TimeoutError(connection)
        } else if (e.name === 'TypeError' && e.message === 'Failed to fetch') {
            return new EvitaDBInstanceNetworkError(connection)
        } else {
            return new UnexpectedError(e.message)
        }
    }
}
