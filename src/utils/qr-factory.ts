import qrcode from 'qrcode-generator';

export type QrFactoryOptions = {
	typeNumber: TypeNumber; // (1 ~ 40), or 0 for auto detection
	errorCorrectionLevel: ErrorCorrectionLevel; // 'L', 'M', 'Q', 'H'
	cellSize: number;
	margin: number;
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
	const { typeNumber = 0, errorCorrectionLevel = 'L', cellSize, margin } = options;

	const qr = qrcode(typeNumber, errorCorrectionLevel);
	qr.addData(data);
	qr.make();

	const svgTag = () => qr.createSvgTag(cellSize, margin);
	const pngBuffer = () => dataURLtoPNG(qr.createDataURL(cellSize, margin));

	return { svgTag, pngBuffer };
};

export default qrFactory;
