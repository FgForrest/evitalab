/**
 * In EvitaDB we define only one-way relationship from the perspective of the entity. We stick to the ERD modelling
 * standards here.
 */
export enum Cardinality {
    ZeroOrOne = 'zeroOrOne',
    ExactlyOne = 'exactlyOne',
    ZeroOrMore = 'zeroOrMore',
    OneOrMore = 'oneOrMore',
    NotSpecified = 'notSpecified'
}
