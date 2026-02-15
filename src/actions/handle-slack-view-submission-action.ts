import { createLinkAction } from './create-link-action';
import { getLinkWithD1Fallback } from '../utils/get-link-with-d1-fallback';
import { linkWithUrl } from '../utils/link-with-url';
import { createLinkResultModalView, lookUpLinkResultModalView } from '../utils/slack-modal-views';
import StatusError from '../errors/status-error';

type SlackViewSubmissionPayload = {
	type: 'view_submission';
	view: {
		callback_id: string;
		state: {
			values: Record<string, Record<string, { type: string; value: string | null }>>;
		};
	};
};

type HandleSlackViewSubmissionParams = {
	payload: SlackViewSubmissionPayload;
	requestUrl: string;
	env: Env;
	ctx: { waitUntil(promise: Promise<unknown>): void };
};

type ViewSubmissionResponse =
	| { response_action: 'update'; view: ReturnType<typeof createLinkResultModalView | typeof lookUpLinkResultModalView> }
	| { response_action: 'errors'; errors: Record<string, string> }
	| null;

export const handleSlackViewSubmissionAction = async ({
	payload,
	requestUrl,
	env,
	ctx,
}: HandleSlackViewSubmissionParams): Promise<ViewSubmissionResponse> => {
	const callbackId = payload.view.callback_id;

	if (callbackId === 'create_link') {
		return handleCreateLink(payload, requestUrl, env, ctx);
	}

	if (callbackId === 'look_up_link') {
		return handleLookUpLink(payload, requestUrl, env, ctx);
	}

	return null;
};

const handleCreateLink = async (
	payload: SlackViewSubmissionPayload,
	requestUrl: string,
	env: Env,
	ctx: { waitUntil(promise: Promise<unknown>): void }
): Promise<ViewSubmissionResponse> => {
	const values = payload.view.state.values;
	const destinationUrl = values.destination_url_block.destination_url.value!;
	const namespace = values.namespace_block.namespace.value || null;
	const shortPath = values.short_path_block.short_path.value || null;

	try {
		const { data: link } = await createLinkAction({
			url: requestUrl,
			data: {
				destinationUrl,
				namespace,
				shortPath,
				redirectStatusCode: 302,
			},
			env,
			ctx,
		});

		return { response_action: 'update', view: createLinkResultModalView(link) };
	} catch (error) {
		if (error instanceof StatusError && error.path === 'id') {
			return {
				response_action: 'errors',
				errors: { short_path_block: error.message },
			};
		}
		return {
			response_action: 'errors',
			errors: { destination_url_block: error instanceof Error ? error.message : 'Something went wrong' },
		};
	}
};

const handleLookUpLink = async (
	payload: SlackViewSubmissionPayload,
	requestUrl: string,
	env: Env,
	ctx: { waitUntil(promise: Promise<unknown>): void }
): Promise<ViewSubmissionResponse> => {
	const values = payload.view.state.values;
	const linkId = values.link_id_block.link_id.value!;

	const link = await getLinkWithD1Fallback(env, linkId, ctx);
	if (!link) {
		return {
			response_action: 'errors',
			errors: { link_id_block: 'No link found with that ID' },
		};
	}

	const linkDetails = linkWithUrl(requestUrl, link);
	return { response_action: 'update', view: lookUpLinkResultModalView(linkDetails) };
};
