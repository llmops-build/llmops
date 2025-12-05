import { Hono } from 'hono';

const models = new Hono()
  .get('/', async (c) => {
    // TODO: Implement models list
    return c.json({ data: [] });
  })
  .get('/:model', async (c) => {
    // TODO: Implement model retrieval
    const model = c.req.param('model');
    return c.json({ id: model });
  })
  .delete('/:model', async (c) => {
    // TODO: Implement model deletion
    const model = c.req.param('model');
    return c.json({ deleted: true, id: model });
  });

export default models;