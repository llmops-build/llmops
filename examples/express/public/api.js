// API utility functions for making HTTP requests

/**
 * Get LLMOps headers from the configuration inputs
 */
function getLLMOpsHeaders() {
  const headers = {};

  const configId = document.getElementById('llmops-config-id')?.value?.trim();
  const envSecret = document.getElementById('llmops-env-secret')?.value?.trim();

  if (configId) {
    headers['x-llmops-config'] = configId;
  }

  if (envSecret) {
    headers['x-llmops-environment'] = envSecret;
  }

  return headers;
}

/**
 * Generic function to make API calls
 */
async function makeAPICall(method, endpoint, body = null, customHeaders = {}) {
  const baseURL = window.location.origin;
  const url = `${baseURL}${endpoint}`;

  // Merge LLMOps headers with custom headers
  const llmopsHeaders = getLLMOpsHeaders();

  const options = {
    method: method,
    headers: {
      'Content-Type': 'application/json',
      ...llmopsHeaders,
      ...customHeaders,
    },
  };

  if (body && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);

    // Get response text first
    const responseText = await response.text();

    // Try to parse as JSON, fallback to text
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    return {
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      data: responseData,
      headers: Object.fromEntries(response.headers.entries()),
    };
  } catch (error) {
    return {
      success: false,
      status: 0,
      statusText: 'Network Error',
      data: error.message,
      error: error,
    };
  }
}

/**
 * Display API response in the specified element
 */
function displayResponse(elementId, response) {
  const element = document.getElementById(elementId);
  element.style.display = 'block';

  // Format the response for display
  const formatted = {
    status: `${response.status} ${response.statusText}`,
    success: response.success,
    data: response.data,
    headers: response.headers,
  };

  element.textContent = JSON.stringify(formatted, null, 2);

  // Apply error styling if request failed
  if (!response.success) {
    element.classList.add('error');
  } else {
    element.classList.remove('error');
  }
}

/**
 * Test the basic API endpoint
 */
async function testBasicAPI() {
  console.log('Testing basic API...');
  const response = await makeAPICall('GET', '/');
  displayResponse('basic-response', response);
}

/**
 * Test the LLMOps health endpoint
 */
async function testHealthAPI() {
  console.log('Testing LLMOps health endpoint...');
  const response = await makeAPICall('GET', '/llmops/health');
  displayResponse('health-response', response);
}

/**
 * Test OpenAI chat completion via client-side SDK
 */
async function testOpenAIChat() {
  const model = document.getElementById('openai-model').value;
  const prompt = document.getElementById('openai-prompt').value.trim();

  if (!prompt) {
    displayResponse('openai-response', {
      success: false,
      status: 400,
      statusText: 'Bad Request',
      data: 'Please enter a prompt',
    });
    return;
  }

  try {
    console.log(`Making OpenAI chat request with model: ${model}`);

    // Import OpenAI dynamically (since we're in a browser environment)
    const OpenAI = (await import('https://cdn.skypack.dev/openai')).default;

    // Get LLMOps headers for the request
    const llmopsHeaders = getLLMOpsHeaders();

    const openai = new OpenAI({
      baseURL: window.location.origin + '/llmops/api/v1/genai',
      apiKey: '',
      dangerouslyAllowBrowser: true, // Note: In production, API calls should go through your backend
      defaultHeaders: llmopsHeaders,
    });

    const chatCompletion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: model,
    });

    displayResponse('openai-response', {
      success: true,
      status: 200,
      statusText: 'OK',
      data: {
        model: chatCompletion.model,
        usage: chatCompletion.usage,
        response: chatCompletion.choices[0].message.content,
      },
    });
  } catch (error) {
    displayResponse('openai-response', {
      success: false,
      status: error.status || 500,
      statusText: error.statusText || 'Error',
      data: error.message || 'Unknown error occurred',
    });
  }
}

/**
 * Test OpenAI completion via server endpoint (more secure approach)
 */
async function testOpenAICompletion() {
  const apiKey = document.getElementById('openai-api-key').value.trim();
  const model = document.getElementById('openai-model').value;
  const prompt = document.getElementById('openai-prompt').value.trim();

  if (!apiKey) {
    displayResponse('openai-response', {
      success: false,
      status: 400,
      statusText: 'Bad Request',
      data: 'Please enter your OpenAI API key',
    });
    return;
  }

  if (!prompt) {
    displayResponse('openai-response', {
      success: false,
      status: 400,
      statusText: 'Bad Request',
      data: 'Please enter a prompt',
    });
    return;
  }

  console.log('Making OpenAI completion request via server...');

  const requestBody = {
    model: model,
    prompt: prompt,
    apiKey: apiKey,
  };

  const response = await makeAPICall(
    'POST',
    '/api/openai/completion',
    requestBody
  );
  displayResponse('openai-response', response);
}

/**
 * Make a custom API call based on form inputs
 */
async function makeCustomAPICall() {
  const method = document.getElementById('custom-method').value;
  const endpoint = document.getElementById('custom-endpoint').value;
  const bodyText = document.getElementById('custom-body').value.trim();
  const headersText = document.getElementById('custom-headers').value.trim();

  let body = null;
  if (bodyText && (method === 'POST' || method === 'PUT')) {
    try {
      body = JSON.parse(bodyText);
    } catch (error) {
      displayResponse('custom-response', {
        success: false,
        status: 400,
        statusText: 'Bad Request',
        data: `Invalid JSON in request body: ${error.message}`,
      });
      return;
    }
  }

  let customHeaders = {};
  if (headersText) {
    try {
      customHeaders = JSON.parse(headersText);
    } catch (error) {
      displayResponse('custom-response', {
        success: false,
        status: 400,
        statusText: 'Bad Request',
        data: `Invalid JSON in custom headers: ${error.message}`,
      });
      return;
    }
  }

  console.log(`Making custom API call: ${method} ${endpoint}`);
  const response = await makeAPICall(method, endpoint, body, customHeaders);
  displayResponse('custom-response', response);
}

/**
 * Utility function to make authenticated requests (if needed)
 */
async function makeAuthenticatedAPICall(method, endpoint, token, body = null) {
  const baseURL = window.location.origin;
  const url = `${baseURL}${endpoint}`;

  const options = {
    method: method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  };

  if (body && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    const responseText = await response.text();

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    return {
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      data: responseData,
      headers: Object.fromEntries(response.headers.entries()),
    };
  } catch (error) {
    return {
      success: false,
      status: 0,
      statusText: 'Network Error',
      data: error.message,
      error: error,
    };
  }
}

// Add some convenience functions for common operations
const api = {
  get: (endpoint) => makeAPICall('GET', endpoint),
  post: (endpoint, data) => makeAPICall('POST', endpoint, data),
  put: (endpoint, data) => makeAPICall('PUT', endpoint, data),
  delete: (endpoint) => makeAPICall('DELETE', endpoint),

  // Authenticated versions
  authGet: (endpoint, token) =>
    makeAuthenticatedAPICall('GET', endpoint, token),
  authPost: (endpoint, token, data) =>
    makeAuthenticatedAPICall('POST', endpoint, token, data),
  authPut: (endpoint, token, data) =>
    makeAuthenticatedAPICall('PUT', endpoint, token, data),
  authDelete: (endpoint, token) =>
    makeAuthenticatedAPICall('DELETE', endpoint, token),
};

// Make the api object available globally
window.api = api;

console.log('API utilities loaded. Use window.api for convenience methods.');
