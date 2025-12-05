// API utility functions for making HTTP requests

/**
 * Generic function to make API calls
 */
async function makeAPICall(method, endpoint, body = null, customHeaders = {}) {
    const baseURL = window.location.origin;
    const url = `${baseURL}${endpoint}`;

    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            ...customHeaders
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
            headers: Object.fromEntries(response.headers.entries())
        };
    } catch (error) {
        return {
            success: false,
            status: 0,
            statusText: 'Network Error',
            data: error.message,
            error: error
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
        headers: response.headers
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
                data: `Invalid JSON in request body: ${error.message}`
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
                data: `Invalid JSON in custom headers: ${error.message}`
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
            'Authorization': `Bearer ${token}`
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
            headers: Object.fromEntries(response.headers.entries())
        };
    } catch (error) {
        return {
            success: false,
            status: 0,
            statusText: 'Network Error',
            data: error.message,
            error: error
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
    authGet: (endpoint, token) => makeAuthenticatedAPICall('GET', endpoint, token),
    authPost: (endpoint, token, data) => makeAuthenticatedAPICall('POST', endpoint, token, data),
    authPut: (endpoint, token, data) => makeAuthenticatedAPICall('PUT', endpoint, token, data),
    authDelete: (endpoint, token) => makeAuthenticatedAPICall('DELETE', endpoint, token)
};

// Make the api object available globally
window.api = api;

console.log('API utilities loaded. Use window.api for convenience methods.');