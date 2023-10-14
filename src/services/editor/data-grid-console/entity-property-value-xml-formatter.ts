import { EntityPropertyValueFormatter } from '@/services/editor/data-grid-console/entity-property-value-formatter'
import xmlFormat from 'xml-formatter'

/**
 * Fake root element for pretty printing XML with multiple roots which is not valid XML but we in data, there may be partial
 * XML/HTML documents.
 */
const xmlFakeRoot = 'evitalabfakeroot'

/**
 * Tries to format the value as XML. If the value is not a valid XML, it will throw an error.
 */
export class EntityPropertyValueXmlFormatter implements EntityPropertyValueFormatter {

    format(value: any, prettyPrint: boolean = false): string {
        // validates the value as XML, and also pretty prints it if needed
        const formattedXml: string = this.formatXml(value)
        if (prettyPrint) {
            return formattedXml
        } else {
            return value
        }
    }

    /**
     * Parses and pretty prints the input XML. This method also support partial XML documents with multiple roots by
     * wrapping the input XML with a fake root element which is then stripped again.
     *
     * @param value XML value to be formatted
     * @private
     */
    private formatXml(value: string): string {
        return xmlFormat(`<${xmlFakeRoot}>${value}</${xmlFakeRoot}>`)
            .split("\r\n")
            .filter(it => !it.includes(xmlFakeRoot))
            .map(it => it.substring(4))
            .join("\r\n")
    }
}
