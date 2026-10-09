/**
 * Pages of the catalog viewer. Each maps onto a small set of engine statistics components it requests on its own, so
 * a page never pays for a page the user has not opened.
 */
export enum CatalogViewerPage {
    Overview = 'overview',
    Storage = 'storage',
    Indexes = 'indexes',
    Memory = 'memory',
    Activity = 'activity',
    History = 'history'
}
