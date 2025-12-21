import { Hono } from 'hono';
import generations from './generations';
import edits from './edits';

/**
 * OpenAI Images API Handler
 * @see https://platform.openai.com/docs/api-reference/images
 */
const images = new Hono()
  .route('/generations', generations)
  .route('/edits', edits);

export default images;
