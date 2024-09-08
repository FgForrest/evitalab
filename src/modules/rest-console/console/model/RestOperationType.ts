import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { HttpMethod } from 'ky/distribution/types/options'

// todo lho docs
export enum RestOperationType {
    Get = 'get',
    List = 'list',
    Query = 'query',
    Schema = 'schema',
    Delete = 'delete'
}

export function uriPath(operationType: RestOperationType): string {
    switch (operationType) {
        case RestOperationType.Get: return '';
        case RestOperationType.List: return 'list';
        case RestOperationType.Query: return 'query';
        case RestOperationType.Schema: return 'schema';
        case RestOperationType.Delete: return '';
        default: throw new UnexpectedError(`Unsupported operation typ '${operationType}'.`)
    }
}

export function usesHttpMethod(operationType: RestOperationType): HttpMethod {
    switch (operationType) {
        case RestOperationType.Get: return 'get';
        case RestOperationType.List: return 'post';
        case RestOperationType.Query: return 'post';
        case RestOperationType.Schema: return 'get';
        case RestOperationType.Delete: return 'delete';
        default: throw new UnexpectedError(`Unsupported operation typ '${operationType}'.`)
    }
}

export function acceptsRequestBody(operationType: RestOperationType): boolean {
    switch (operationType) {
        case RestOperationType.Get: return false;
        case RestOperationType.List: return true;
        case RestOperationType.Query: return true;
        case RestOperationType.Schema: return false;
        case RestOperationType.Delete: return true;
        default: throw new UnexpectedError(`Unsupported operation typ '${operationType}'.`)
    }
}
