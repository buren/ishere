// Only allow [a-zA-Z0-9_-]
export const isValidPathPattern = (value: string) => {
	// Check if the string starts or ends with a hyphen or underscore
	if (/^[-_]/.test(value) || /[-_]$/.test(value)) {
		return false;
	}

	return /^[\w-]+$/.test(value);
};
