import { NamingConvention } from "@/modules/connection/model/NamingConvetion";
import { GrpcNamingConvention } from "../gen/GrpcEnums_pb";
import { GrpcNameVariant } from "../gen/GrpcEvitaDataTypes_pb";
import { Map } from "immutable";

export class MapUtil {
    public static getNamingMap(nameVariant: GrpcNameVariant[]): Map<NamingConvention, string>{
        return Map([
            [
                NamingConvention.CamelCase,
                this.convertNamingConvention(
                    nameVariant,
                    GrpcNamingConvention.CAMEL_CASE
                ),
            ],
            [
                NamingConvention.PascalCase,
                this.convertNamingConvention(
                    nameVariant,
                    GrpcNamingConvention.PASCAL_CASE
                ),
            ],
            [
                NamingConvention.SnakeCase,
                this.convertNamingConvention(
                    nameVariant,
                    GrpcNamingConvention.SNAKE_CASE
                ),
            ],
            [
                NamingConvention.UpperSnakeCase,
                this.convertNamingConvention(
                    nameVariant,
                    GrpcNamingConvention.UPPER_SNAKE_CASE
                ),
            ],
            [
                NamingConvention.KebabCase,
                this.convertNamingConvention(
                    nameVariant,
                    GrpcNamingConvention.KEBAB_CASE
                ),
            ],
        ])
    }
    private static convertNamingConvention(
        namingConvention: GrpcNameVariant[],
        targetConvention: GrpcNamingConvention
    ): string {
        return (
            namingConvention.find(
                (x) => x.namingConvention === targetConvention
            )?.name ?? ''
        )
    }
}