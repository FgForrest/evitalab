import type { TabParamsDto } from '@/modules/workspace/tab/model/TabParamsDto'
import type { ErrorSummaryDto } from '@/modules/base/exception/ErrorSummaryDto'

/**
 * Serializable form of {@link ErrorViewerTabParams}.
 */
export interface ErrorViewerTabParamsDto extends TabParamsDto {
    readonly error: ErrorSummaryDto
}
