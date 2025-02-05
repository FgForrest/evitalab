/**
 * Enum to specify the depth of details sent in the traffic recording event.
 */
export enum TrafficRecordContent {

    /**
     * Only the header of the event is sent.
     */
    Header = 'header',
    /**
     * Entire record contents is sent.
     */
    Body = 'body'
}
