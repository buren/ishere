// import { afterEach, describe, expect, it, vi } from 'vitest';
// import { createExecutionContext, env } from 'cloudflare:test';

// import { action } from '../src/action';
// import * as utils from '../src/utils/generate-short-id'; // This import is now mocked
// import { defaultShortPathLength } from '../src/utils/constants';
// import { LinkKVSchema } from '../src/types';
// import { linkWithUrl } from '../src/utils/link-with-url';
// import { createLinkAction } from '../src/actions/create-link-action';

// vi.mock('./utils/generate-short-id');

// describe('action', async () => {
// 	afterEach(() => {
// 		vi.clearAllMocks();
// 		// vi.resetModules();
// 		vi.restoreAllMocks();
// 	});

// 	it('watman', async () => {
// 		const generatedPart = 'xyz789';
// 		vi.spyOn(utils, 'generateShortId').mockReturnValue(generatedPart);

// 		const namespace = 'testns';
// 		const data = { destinationUrl: 'https://example.com', length: defaultShortPathLength, namespace };

// 		const expectedId = `${namespace}-${generatedPart}`;
// 		const expectedLink: LinkKVSchema = {
// 			id: expectedId,
// 			destinationUrl: data.destinationUrl,
// 			namespace: namespace,
// 			createdAt: expect.any(Date),
// 			updatedAt: expect.any(Date),
// 		};
// 		const expectedResultData = linkWithUrl('https://example.com', expectedLink);

// 		const ctx = createExecutionContext();
// 		const result = await createLinkAction({ data, url: 'https://example.com', env, ctx });

// 		expect(result.data).toEqual(expectedResultData);
// 		expect(utils.generateShortId).toHaveBeenCalledWith(defaultShortPathLength);

// 		// **** Assert KV State ****
// 		const kvResult = await env.KV.get(expectedId, { type: 'json' });
// 		expect(kvResult).toEqual(expectedLink);
// 		const kvMeta = await env.KV.getWithMetadata(expectedId);
// 		expect(kvMeta.metadata).toBeNull();
// 	});

// 	it('action should work', async () => {
// 		const expectedId = 'gen123';
// 		vi.spyOn(utils, 'generateShortId').mockReturnValue(expectedId);

// 		const lengthArg = 5;
// 		const result = await action(env, createExecutionContext(), lengthArg);

// 		// Assuming 'action' internally uses generateShortId with some length
// 		// If 'action' directly returns a string concatenated with a hardcoded value,
// 		// the following expectation might need adjustment based on the actual implementation.
// 		// If 'action' calls generateShortId with 'lengthArg', then the expectation is correct.
// 		// expect(mockGenerateShortId).toHaveBeenCalled();

// 		// It's better to be specific about the arguments if possible.
// 		// If 'action' uses 'lengthArg' for generateShortId:
// 		// expect(utils.generateShortId).toHaveBeenCalledWith(defaultShortPathLength);

// 		// Assuming 'action' concatenates the result of generateShortId with "-78"
// 		expect(result).toEqual(`${expectedId}-78`);
// 	});
// });

import { describe, expect, it, vi, beforeEach } from 'vitest';
import * as utils from '../src/utils/generate-short-id';
import { action } from '../src/action';

vi.mock('./utils/generate-short-id');
vi.mock('./db');

describe('action', () => {
	const envMock = { D1: {} } as unknown as Env;
	const ctxMock = { waitUntil: vi.fn() } as unknown as ExecutionContext;

	beforeEach(() => {
		vi.resetAllMocks();
	});

	it('should generate an ID and create a DB link', async () => {
		const mockId = 'abcd1234';
		vi.spyOn(utils, 'generateShortId').mockReturnValue(mockId);

		// const dbCreateLinkSpy = vi.spyOn(db, 'dbCreateLink').mockResolvedValue(undefined);

		const result = await action(envMock, ctxMock, 10);

		expect(utils.generateShortId).toHaveBeenCalledWith(8);
		expect(ctxMock.waitUntil).toHaveBeenCalled();

		// expect(dbCreateLinkSpy).toHaveBeenCalledWith(envMock.D1, {
		// 	id: 'asdasdasd',
		// 	destinationUrl: 'https://example.com',
		// 	namespace: null,
		// });

		expect(result).toBe(`${mockId}-83`);
	});
});
