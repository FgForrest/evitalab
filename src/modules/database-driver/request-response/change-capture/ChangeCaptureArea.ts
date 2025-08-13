/**
 * The enum defines what catalog area is covered by the capture.
 */
export enum ChangeCaptureArea {
    /**
     * Changes in the schema are captured.
     */
    Schema = 'schema',
    /**
     * Changes in the data are captured.
     */
    Data = 'data',
    /**
     * Infrastructural mutations that are neither schema nor data.
     */
    Infrastructure = 'infrastructure'
}