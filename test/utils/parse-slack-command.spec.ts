import { describe, expect, it } from 'vitest';
import { parseSlackCommand } from '../../src/utils/parse-slack-command';

describe('parseSlackCommand', () => {
	it('should handle empty or help command', () => {
		expect(parseSlackCommand('')).toEqual({ command: 'help' });
		expect(parseSlackCommand('help')).toEqual({ command: 'help' });
		expect(parseSlackCommand('   help  ')).toEqual({ command: 'help' });
	});

	it('should parse stats command correctly', () => {
		expect(parseSlackCommand('stats abc')).toEqual({
			command: 'stats',
			id: 'abc',
		});
		expect(parseSlackCommand('stats xyz')).toEqual({
			command: 'stats',
			id: 'xyz',
		});

		expect(parseSlackCommand('stats https://example.com/name/xyz')).toEqual({
			command: 'stats',
			id: 'name-xyz',
		});

		// The period parameter is no longer supported
		expect(parseSlackCommand('  stats  pqr day  ')).toEqual({
			command: 'stats',
			id: 'pqr',
		});
	});

	it('should parse get command correctly', () => {
		expect(parseSlackCommand('get abc')).toEqual({
			command: 'get',
			id: 'abc',
		});
		expect(parseSlackCommand('  get  xyz  ')).toEqual({
			command: 'get',
			id: 'xyz',
		});
		expect(parseSlackCommand('  get  https://example.com/name/xyz  ')).toEqual({
			command: 'get',
			id: 'name-xyz',
		});
	});

	it('should parse create command correctly', () => {
		expect(parseSlackCommand('create http://example.com')).toEqual({
			command: 'create',
			destinationUrl: 'http://example.com',
		});
		expect(parseSlackCommand('create abc http://example.com')).toEqual({
			command: 'create',
			namespace: 'abc',
			destinationUrl: 'http://example.com',
		});
		expect(parseSlackCommand('create abc def http://example.com')).toEqual({
			command: 'create',
			namespace: 'abc',
			shortPath: 'def',
			destinationUrl: 'http://example.com',
		});
		expect(parseSlackCommand('  create  xyz http://example.com  ')).toEqual({
			command: 'create',
			namespace: 'xyz',
			destinationUrl: 'http://example.com',
		});
	});

	it('should parse update command correctly', () => {
		expect(parseSlackCommand('update abc https://example.com')).toEqual({
			command: 'update',
			id: 'abc',
			destinationUrl: 'https://example.com',
		});
		expect(parseSlackCommand('update abc-abc https://example.com')).toEqual({
			command: 'update',
			id: 'abc-abc',
			destinationUrl: 'https://example.com',
		});
	});

	it('should return invalid for invalid commands', () => {
		expect(parseSlackCommand('invalid')).toEqual({ command: 'invalid' });
		expect(parseSlackCommand('stats')).toEqual({ command: 'invalid' });
		expect(parseSlackCommand('get')).toEqual({ command: 'invalid' });
		expect(parseSlackCommand('create')).toEqual({ command: 'invalid' });
		expect(parseSlackCommand('update')).toEqual({ command: 'invalid' });
		expect(parseSlackCommand('put abc')).toEqual({ command: 'invalid' });
		expect(parseSlackCommand('  invalid  xyz  ')).toEqual({ command: 'invalid' });
	});
});
