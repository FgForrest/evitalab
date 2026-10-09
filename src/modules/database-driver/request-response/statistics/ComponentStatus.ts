import { CatalogStatisticsComponent } from '@/modules/database-driver/request-response/statistics/CatalogStatisticsComponent'
import { ComponentAvailability } from '@/modules/database-driver/request-response/statistics/ComponentAvailability'

/**
 * Outcome of one requested statistics component. Only requested components get a status - a component the client did
 * not ask for carries no status at all.
 */
export class ComponentStatus {

    readonly component: CatalogStatisticsComponent
    readonly availability: ComponentAvailability
    /**
     * Human-readable explanation of why the component could not be delivered. Unset when it was delivered, and never
     * a substitute for reading {@link availability} itself.
     */
    readonly reason: string | undefined

    constructor(
        component: CatalogStatisticsComponent,
        availability: ComponentAvailability,
        reason: string | undefined
    ) {
        this.component = component
        this.availability = availability
        this.reason = reason
    }

    get delivered(): boolean {
        return this.availability === ComponentAvailability.Delivered
    }
}
