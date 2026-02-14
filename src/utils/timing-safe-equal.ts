const timingSafeEqual = async (a: string, b: string): Promise<boolean> => {
	const encoder = new TextEncoder();
	const aBuf = encoder.encode(a);
	const bBuf = encoder.encode(b);
	if (aBuf.byteLength !== bBuf.byteLength) return false;
	return crypto.subtle.timingSafeEqual(aBuf, bBuf);
};

export default timingSafeEqual;
