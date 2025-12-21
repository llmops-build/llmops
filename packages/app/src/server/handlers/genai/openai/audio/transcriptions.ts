import { Hono } from 'hono';

/**
 * OpenAI Audio Transcriptions API Handler
 * POST /v1/audio/transcriptions - Transcribe audio to text
 * @see https://platform.openai.com/docs/api-reference/audio/createTranscription
 */
const transcriptions = new Hono().post('/', async (c) => {
  // TODO: Implement audio transcription
  throw new Error('Not implemented yet');
});

export default transcriptions;
