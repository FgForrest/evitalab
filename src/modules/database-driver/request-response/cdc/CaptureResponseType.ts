/**
 * Internal counterpart of the gRPC `GrpcCaptureResponseType`. Specifies the type of a response
 * received on a system change-capture stream.
 */
export enum CaptureResponseType {
    /** The response contains only the acknowledgement of the subscription. */
    Acknowledgement = 'acknowledgement',
    /** The response contains a captured change event. */
    Change = 'change',
    /** The response contains a heartbeat event. */
    Heartbeat = 'heartbeat'
}
