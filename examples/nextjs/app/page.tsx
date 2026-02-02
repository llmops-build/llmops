export default function Home() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>LLMOps Next.js Example</h1>
      <p>
        This is a minimal Next.js application demonstrating the @llmops/sdk
        integration.
      </p>

      <h2>Available Endpoints</h2>
      <ul>
        <li>
          <code>/api/llmops/health</code> - Health check
        </li>
        <li>
          <code>/api/llmops/api/genai/v1/chat/completions</code> - Chat
          completions (OpenAI-compatible)
        </li>
      </ul>

      <h2>Example Usage</h2>
      <pre
        style={{
          background: '#f4f4f4',
          padding: '1rem',
          borderRadius: '4px',
          overflow: 'auto',
        }}
      >
        {`curl -X POST http://localhost:3000/api/llmops/api/genai/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <your-environment-secret>" \\
  -H "x-llmops-config: <your-config-id>" \\
  -d '{
    "model": "gpt-4o-mini",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`}
      </pre>
    </main>
  );
}
