import type { ToastClickCallback, Toaster } from '@/modules/notification/service/Toaster'
import { isConnectivityError } from '@/modules/database-driver/exception/connectivityError'
import {
    currentOutageReportingRound,
    isServerUnreachable
} from '@/modules/database-driver/model/serverConnectivity'
import { i18n } from '@/vue-plugins/i18n'

/**
 * Wraps a {@link Toaster} and reports an outage **once per reporting round**, leaving every other notification
 * untouched. A round covers one outage — plus one extra report each time a user explicitly asks for fresh data
 * (see {@link requestOutageReport}), so a *Reload* pressed deep into an outage still gets an answer.
 *
 * Why this exists: when the server is unreachable, every action that wants fresh data fails, and each failure
 * used to raise its own notification — one user action could bury the screen in near-identical network errors
 * that carry no information beyond the first one.
 *
 * Keyed on {@link isServerUnreachable} rather than on a time window, so the whole outage is one episode no matter
 * how long it lasts, and no timers are involved. Nothing is lost: the underlying failure always reaches
 * `console.error`, and recovery ends the round so a later outage is reported again.
 */
export class ConnectivityAwareToaster implements Toaster {

    private readonly delegate: Toaster
    /**
     * Reporting round this toaster has already reported, so the next one is reported again.
     */
    private lastReportedOutageRound?: number

    constructor(delegate: Toaster) {
        this.delegate = delegate
    }

    async success(title: string, clickCallback?: ToastClickCallback): Promise<void> {
        await this.delegate.success(title, clickCallback)
    }

    async info(title: string, clickCallback?: ToastClickCallback): Promise<void> {
        await this.delegate.info(title, clickCallback)
    }

    async warning(title: string, clickCallback?: ToastClickCallback): Promise<void> {
        await this.delegate.warning(title, clickCallback)
    }

    async error(title: string, error?: Error): Promise<void> {
        if (!ConnectivityAwareToaster.isServerUnreachableReport(error)) {
            await this.delegate.error(title, error)
            return
        }

        // keep the failure diagnosable regardless of whether it gets reported — for a report carrying no error
        // the title is the only place the reason exists, so it must not be lost with the notification
        console.error(`${title} (server unreachable)`, error)

        const outageRound: number = currentOutageReportingRound()
        if (this.lastReportedOutageRound === outageRound) {
            return
        }
        this.lastReportedOutageRound = outageRound

        // one generic message rather than the caller's title: the useful information is that the server cannot
        // be reached, and which of the many failing reads noticed it first is noise
        await this.delegate.error(i18n.global.t('common.notification.serverUnreachable'), error)
    }

    /**
     * Whether a reported failure is evitaLab being offline.
     *
     * Two kinds of report have to be recognized. One carries the error and is classified directly — every
     * connectivity error reaching a component came through `ErrorTransformer`, which has therefore already
     * flipped the state, so a round always exists by the time this is asked. The other carries only a
     * pre-formatted title (the majority of reporting sites interpolate the reason into it and pass no error);
     * with nothing to classify, it counts as an outage report exactly while the server is unreachable.
     */
    private static isServerUnreachableReport(error?: Error): boolean {
        if (error != undefined) {
            return isConnectivityError(error)
        }
        return isServerUnreachable()
    }
}
