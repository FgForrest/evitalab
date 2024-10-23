/**
 * Defines user-desired output format for a single entity property value.
 * The auto output format tries to guess the best renderer based on the property value type with support
 * for all evitaDB data types.
 * Other formats simply take the raw input value and render it in the desired format without any "smart" logic
 * about the actual value.
 */
export enum EntityPropertyValueDesiredOutputFormat {
    /**
     * Renders pretty printed raw input value based on its schema data type.
     */
    AutoPrettyPrint = 'autoPrettyPrint',
    /**
     * Renders any rwa input value as a Markdown source.
     */
    Markdown = 'markdown',
    /**
     * Renders any raw input value in code block without any syntax highlighting.
     */
    Raw = 'raw',
    /**
     * Renders any raw input value as a JSON source.
     */
    Json = 'json',
    /**
     * Renders any raw input value as a XML source.
     */
    Xml = 'xml',
    /**
     * Renders HTML in input value.
     */
    Html = 'html',
    /**
     * Special format for rendering entity price object.
     */
    Price = 'price'
}
