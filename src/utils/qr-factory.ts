import qrcode from 'qrcode-generator';

export type QrFactoryOptions = {
	typeNumber: TypeNumber; // (1 ~ 40), or 0 for auto detection
	errorCorrectionLevel: ErrorCorrectionLevel; // 'L', 'M', 'Q', 'H'
	size: number; // desired total image size in pixels
	margin: number; // quiet zone in pixels
};

const dataURLtoPNG = async (dataURL: string): Promise<ArrayBuffer> => {
	const base64 = dataURL.split(',')[1];
	const binaryString = atob(base64);
	const len = binaryString.length;
	const bytes = new Uint8Array(len);
	for (let i = 0; i < len; i++) {
		bytes[i] = binaryString.charCodeAt(i);
	}
	return bytes.buffer;
};

const qrFactory = (data: string, options: QrFactoryOptions) => {
	const { typeNumber = 0, errorCorrectionLevel = 'L', size, margin } = options;

	const qr = qrcode(typeNumber, errorCorrectionLevel);
	qr.addData(data);
	qr.make();

	const moduleCount = qr.getModuleCount();
	const cellSize = calculateCellSize(size, margin, moduleCount);

	const svgTag = () => qr.createSvgTag(cellSize, margin);
	const pngBuffer = () => dataURLtoPNG(qr.createDataURL(cellSize, margin));

	return { svgTag, pngBuffer };
};

export const calculateCellSize = (size: number, margin: number, moduleCount: number): number =>
	Math.max(1, Math.floor((size - margin * 2) / moduleCount));

export default qrFactory;
