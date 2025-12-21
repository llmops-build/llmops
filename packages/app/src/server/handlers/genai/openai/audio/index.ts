import { Hono } from 'hono';
import speech from './speech';
import transcriptions from './transcriptions';
import translations from './translations';

/**
 * OpenAI Audio API Handler
 * @see https://platform.openai.com/docs/api-reference/audio
 */
const audio = new Hono()
  .route('/speech', speech)
  .route('/transcriptions', transcriptions)
  .route('/translations', translations);

export default audio;
