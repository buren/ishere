import { describe, it, expect } from 'vitest';
import { calculateCellSize } from '../../src/utils/qr-factory';

describe('calculateCellSize', () => {
	// Formula: cellSize = max(1, floor((size - margin * 2) / moduleCount))
	// Actual image size: moduleCount * cellSize + margin * 2

	it('should calculate cellSize for a typical QR code', () => {
		// 21 modules (short URL), 200px target, 16px margin
		// (200 - 32) / 21 = 8
		const cellSize = calculateCellSize(200, 16, 21);
		expect(cellSize).toBe(8);

		// Actual size: 21 * 8 + 32 = 200
		const actualSize = 21 * cellSize + 16 * 2;
		expect(actualSize).toBe(200);
	});

	it('should floor the result for non-integer division', () => {
		// 25 modules, 200px target, 16px margin
		// (200 - 32) / 25 = 6.72 → 6
		const cellSize = calculateCellSize(200, 16, 25);
		expect(cellSize).toBe(6);

		// Actual size: 25 * 6 + 32 = 182 (slightly under target)
		const actualSize = 25 * cellSize + 16 * 2;
		expect(actualSize).toBeLessThanOrEqual(200);
	});

	it('should handle zero margin', () => {
		// 21 modules, 200px target, 0 margin
		// 200 / 21 = 9.52 → 9
		const cellSize = calculateCellSize(200, 0, 21);
		expect(cellSize).toBe(9);
	});

	it('should handle large size', () => {
		// 21 modules, 1024px target, 16px margin
		// (1024 - 32) / 21 = 47.24 → 47
		const cellSize = calculateCellSize(1024, 16, 21);
		expect(cellSize).toBe(47);
	});

	it('should clamp to minimum of 1 when size is very small', () => {
		// 33 modules, 29px target, 0 margin
		// 29 / 33 = 0.87 → clamped to 1
		const cellSize = calculateCellSize(29, 0, 33);
		expect(cellSize).toBe(1);
	});

	it('should clamp to minimum of 1 when margin consumes most of the size', () => {
		// 21 modules, 50px target, 100px margin
		// (50 - 200) / 21 = -7.14 → clamped to 1
		const cellSize = calculateCellSize(50, 100, 21);
		expect(cellSize).toBe(1);
	});

	it('should handle higher module counts from longer URLs', () => {
		// 33 modules (longer URL), 200px target, 16px margin
		// (200 - 32) / 33 = 5.09 → 5
		const cellSize = calculateCellSize(200, 16, 33);
		expect(cellSize).toBe(5);
	});
});
