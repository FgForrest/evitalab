/**
 * Defines why a classifier is not valid
 */
export enum ClassifierValidationErrorType {
    Empty = 'empty',
    LeadingTrailingWhiteSpace = 'leadingTrailingWhiteSpace',
    Keyword = 'keyword',
    Format = 'format'
}

