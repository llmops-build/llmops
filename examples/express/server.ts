import express from 'express';
import { createLLMOpsMiddleware } from '@llmops/sdk/express';

const app = express();
const port = 3000;

const llmops = createLLMOpsMiddleware({ basePath: '/llmops' });

app.use(express.static('public'));
app.use('/llmops', llmops);
app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
