import { List as ImmutableList } from 'immutable'
import { Uuid } from '../../data-type/Uuid'
import { ChangeCaptureCriteria } from '@/modules/database-driver/request-response/change-capture/ChangeCaptureCriteria'
import { ChangeCaptureContent } from '@/modules/database-driver/request-response/change-capture/ChangeCaptureContent'

/**
 * Request to register for system change capture notifications. This allows clients to subscribe
 * to specific changes happening in the evitaDB system based on provided criteria.
 */
export class RegisterSystemChangeCaptureRequest {
    /**
     * Unique identifier of the client registering for change capture notifications.
     * Used to track and manage subscriptions.
     */
    readonly clientId?: Uuid
    /**
     * Criteria defining what changes should be captured and reported to the client.
     * Multiple criteria can be specified to capture different types of changes.
     */
    readonly criteria: ImmutableList<ChangeCaptureCriteria>
    /**
     * Specifies the level of detail to include in the captured change events.
     * Can be either headers only or full change content.
     */
    readonly content: ChangeCaptureContent
    /**
     * Optional session identifier to associate the change capture registration with a specific session.
     * If provided, the capture will be automatically unregistered when the session ends.
     */
    readonly sessionId?: Uuid
    /**
     * Optional timeout in milliseconds after which the change capture registration will be automatically removed.
     * If not provided, the registration remains active until explicitly unregistered.
     */
    readonly timeoutMs: number

    constructor(clientId: Uuid | undefined,
                criteria: ImmutableList<ChangeCaptureCriteria>,
                content: ChangeCaptureContent,
                sessionId: Uuid | undefined,
                timeoutMs: number) {
        this.clientId = clientId
        this.criteria = criteria
        this.content = content
        this.sessionId = sessionId
        this.timeoutMs = timeoutMs
    }
}