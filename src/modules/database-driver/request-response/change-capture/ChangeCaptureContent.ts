/**
 * Enum to specify the depth of details sent in the change capture event.
 */
export enum ChangeCaptureContent {
    /**
     * Only the header of the event is sent.
     */
    ChangeHeader = 'changeHeader',
    /**
     * Entire mutation triggering the event is sent. In case of mutations with the large content (associated data
     * update), the size of the event can be significant. Consider whether you need the entire mutation or just the
     * header.
     */
    ChangeBody = 'changeBody'
}