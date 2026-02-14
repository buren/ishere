import { defaultQrMargin, defaultQrSize } from './constants';
import { QrFactoryOptions } from './qr-factory';

const first = <T>(maybeArray: T | T[]): T => {
	if (Array.isArray(maybeArray)) {
		return maybeArray?.[0];
	}

	return maybeArray;
};

export type QrFormat = 'svg' | 'png' | 'html';

export type ParsedQRQuery = QrFactoryOptions & {
	format: QrFormat;
};

const parseQrQuery = (query: Record<string, string | string[] | undefined>): ParsedQRQuery => {
	const {
		format = 'svg',
		type_number: typeNumber = 0, // (1 ~ 40), or 0 for auto detection
		error_correction: errorCorrectionLevel = 'L', // 'L', 'M', 'Q', 'H'
		size = String(defaultQrSize),
		margin = String(defaultQrMargin),
	} = query;

	return {
		format: first(format) as QrFormat,
		typeNumber: Number(first(typeNumber)) as TypeNumber,
		errorCorrectionLevel: first(errorCorrectionLevel) as ErrorCorrectionLevel,
		size: Number(first(size)),
		margin: Number(first(margin)),
	};
};

export default parseQrQuery;
