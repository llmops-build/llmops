/**
 * Provider field definitions for dynamic form rendering
 * Maps provider IDs to their specific configuration fields
 */

export interface ProviderFieldDefinition {
  name: string;
  label: string;
  type: 'text' | 'password' | 'textarea' | 'select';
  placeholder?: string;
  required?: boolean;
  description?: string;
  options?: { value: string; label: string }[];
}

export interface ProviderFieldConfig {
  fields: ProviderFieldDefinition[];
}

/**
 * Base fields common to all providers
 */
const baseFields: ProviderFieldDefinition[] = [
  {
    name: 'apiKey',
    label: 'API Key',
    type: 'password',
    placeholder: 'Enter your API key',
    required: true,
  },
  {
    name: 'customHost',
    label: 'Custom Base URL',
    type: 'text',
    placeholder: 'https://api.example.com',
    description: 'Override the default API endpoint (optional)',
  },
];

/**
 * Provider-specific field definitions
 */
export const providerFieldDefinitions: Record<string, ProviderFieldConfig> = {
  // OpenAI
  openai: {
    fields: [
      ...baseFields,
      {
        name: 'openaiOrganization',
        label: 'Organization ID',
        type: 'text',
        placeholder: 'org-...',
        description: 'Your OpenAI organization ID (optional)',
      },
      {
        name: 'openaiProject',
        label: 'Project ID',
        type: 'text',
        placeholder: 'proj_...',
        description: 'Your OpenAI project ID (optional)',
      },
      {
        name: 'openaiBeta',
        label: 'Beta Features',
        type: 'text',
        placeholder: 'assistants=v2',
        description: 'OpenAI beta features header (optional)',
      },
    ],
  },

  // Anthropic
  anthropic: {
    fields: [
      ...baseFields,
      {
        name: 'anthropicBeta',
        label: 'Beta Features',
        type: 'text',
        placeholder: 'messages-2024-07-01',
        description: 'Anthropic beta features header (optional)',
      },
      {
        name: 'anthropicVersion',
        label: 'API Version',
        type: 'text',
        placeholder: '2023-06-01',
        description: 'Anthropic API version (optional)',
      },
    ],
  },

  // Azure OpenAI
  'azure-openai': {
    fields: [
      {
        name: 'apiKey',
        label: 'API Key',
        type: 'password',
        placeholder: 'Enter your Azure API key',
        required: true,
      },
      {
        name: 'resourceName',
        label: 'Resource Name',
        type: 'text',
        placeholder: 'my-azure-resource',
        description: 'Your Azure resource name',
        required: true,
      },
      {
        name: 'deploymentId',
        label: 'Deployment ID',
        type: 'text',
        placeholder: 'gpt-4-deployment',
        description: 'Your Azure deployment ID',
        required: true,
      },
      {
        name: 'apiVersion',
        label: 'API Version',
        type: 'text',
        placeholder: '2024-02-15-preview',
        description: 'Azure OpenAI API version',
      },
      {
        name: 'azureAuthMode',
        label: 'Authentication Mode',
        type: 'select',
        options: [
          { value: 'apiKey', label: 'API Key' },
          { value: 'entra', label: 'Entra ID (Azure AD)' },
          { value: 'managed', label: 'Managed Identity' },
          { value: 'workload', label: 'Workload Identity' },
        ],
      },
      {
        name: 'azureAdToken',
        label: 'Azure AD Token',
        type: 'password',
        placeholder: 'Enter Azure AD token',
        description: 'For Entra ID authentication',
      },
      {
        name: 'customHost',
        label: 'Custom Endpoint',
        type: 'text',
        placeholder: 'https://my-resource.openai.azure.com',
      },
    ],
  },

  // Azure AI (Foundry)
  'azure-ai': {
    fields: [
      {
        name: 'apiKey',
        label: 'API Key',
        type: 'password',
        placeholder: 'Enter your Azure AI API key',
        required: true,
      },
      {
        name: 'azureFoundryUrl',
        label: 'Foundry URL',
        type: 'text',
        placeholder: 'https://your-project.services.ai.azure.com/models',
        description: 'Azure AI Foundry endpoint URL',
        required: true,
      },
      {
        name: 'azureDeploymentName',
        label: 'Deployment Name',
        type: 'text',
        placeholder: 'gpt-4o-mini',
        description: 'Model deployment name',
      },
      {
        name: 'azureApiVersion',
        label: 'API Version',
        type: 'text',
        placeholder: '2024-05-01-preview',
      },
    ],
  },

  // AWS Bedrock
  bedrock: {
    fields: [
      {
        name: 'awsAccessKeyId',
        label: 'AWS Access Key ID',
        type: 'text',
        placeholder: 'AKIAIOSFODNN7EXAMPLE',
        required: true,
      },
      {
        name: 'awsSecretAccessKey',
        label: 'AWS Secret Access Key',
        type: 'password',
        placeholder: 'Enter your AWS secret access key',
        required: true,
      },
      {
        name: 'awsRegion',
        label: 'AWS Region',
        type: 'text',
        placeholder: 'us-east-1',
        required: true,
      },
      {
        name: 'awsSessionToken',
        label: 'Session Token',
        type: 'password',
        placeholder: 'For temporary credentials',
        description: 'AWS session token (optional)',
      },
      {
        name: 'awsAuthType',
        label: 'Authentication Type',
        type: 'select',
        options: [
          { value: 'apiKey', label: 'Access Keys' },
          { value: 'assumedRole', label: 'Assumed Role' },
        ],
      },
      {
        name: 'awsRoleArn',
        label: 'Role ARN',
        type: 'text',
        placeholder: 'arn:aws:iam::123456789:role/MyRole',
        description: 'For assumed role authentication',
      },
      {
        name: 'awsBedrockModel',
        label: 'Model ID',
        type: 'text',
        placeholder: 'anthropic.claude-3-sonnet-20240229-v1:0',
      },
    ],
  },

  // AWS Sagemaker
  sagemaker: {
    fields: [
      {
        name: 'awsAccessKeyId',
        label: 'AWS Access Key ID',
        type: 'text',
        placeholder: 'AKIAIOSFODNN7EXAMPLE',
        required: true,
      },
      {
        name: 'awsSecretAccessKey',
        label: 'AWS Secret Access Key',
        type: 'password',
        placeholder: 'Enter your AWS secret access key',
        required: true,
      },
      {
        name: 'awsRegion',
        label: 'AWS Region',
        type: 'text',
        placeholder: 'us-east-1',
        required: true,
      },
      {
        name: 'amznSagemakerModelName',
        label: 'SageMaker Model Name',
        type: 'text',
        placeholder: 'my-model-endpoint',
      },
      {
        name: 'amznSagemakerInferenceComponent',
        label: 'Inference Component',
        type: 'text',
        placeholder: 'my-inference-component',
      },
    ],
  },

  // Google Vertex AI
  'vertex-ai': {
    fields: [
      {
        name: 'apiKey',
        label: 'API Key',
        type: 'password',
        placeholder: 'Enter your Google API key',
      },
      {
        name: 'vertexProjectId',
        label: 'Project ID',
        type: 'text',
        placeholder: 'my-gcp-project',
        required: true,
      },
      {
        name: 'vertexRegion',
        label: 'Region',
        type: 'text',
        placeholder: 'us-central1',
        required: true,
      },
      {
        name: 'vertexServiceAccountJson',
        label: 'Service Account JSON',
        type: 'textarea',
        placeholder: '{"type": "service_account", ...}',
        description: 'Service account credentials JSON',
      },
      {
        name: 'vertexModelName',
        label: 'Model Name',
        type: 'text',
        placeholder: 'gemini-1.5-pro',
      },
    ],
  },

  // Google AI (Gemini)
  google: {
    fields: baseFields,
  },

  // Cloudflare Workers AI
  'workers-ai': {
    fields: [
      ...baseFields,
      {
        name: 'workersAiAccountId',
        label: 'Account ID',
        type: 'text',
        placeholder: 'Your Cloudflare account ID',
        required: true,
      },
    ],
  },

  // Stability AI
  'stability-ai': {
    fields: [
      ...baseFields,
      {
        name: 'stabilityClientId',
        label: 'Client ID',
        type: 'text',
        placeholder: 'Your client ID',
      },
      {
        name: 'stabilityClientUserId',
        label: 'Client User ID',
        type: 'text',
        placeholder: 'Your client user ID',
      },
      {
        name: 'stabilityClientVersion',
        label: 'Client Version',
        type: 'text',
        placeholder: '1.0.0',
      },
    ],
  },

  // Hugging Face
  huggingface: {
    fields: [
      ...baseFields,
      {
        name: 'huggingfaceBaseUrl',
        label: 'Inference Endpoint URL',
        type: 'text',
        placeholder:
          'https://your-endpoint.us-east-1.aws.endpoints.huggingface.cloud',
        description: 'Custom inference endpoint URL',
      },
    ],
  },

  // Fireworks AI
  'fireworks-ai': {
    fields: [
      ...baseFields,
      {
        name: 'fireworksAccountId',
        label: 'Account ID',
        type: 'text',
        placeholder: 'Your Fireworks account ID',
      },
    ],
  },

  // Mistral AI
  'mistral-ai': {
    fields: [
      ...baseFields,
      {
        name: 'mistralFimCompletion',
        label: 'FIM Completion',
        type: 'select',
        options: [
          { value: '', label: 'Disabled' },
          { value: 'true', label: 'Enabled' },
        ],
        description: 'Use Fill-In-Middle completions endpoint',
      },
    ],
  },

  // Oracle Cloud
  oracle: {
    fields: [
      {
        name: 'oracleTenancy',
        label: 'Tenancy OCID',
        type: 'text',
        placeholder: 'ocid1.tenancy.oc1...',
        required: true,
      },
      {
        name: 'oracleUser',
        label: 'User OCID',
        type: 'text',
        placeholder: 'ocid1.user.oc1...',
        required: true,
      },
      {
        name: 'oracleFingerprint',
        label: 'API Key Fingerprint',
        type: 'text',
        placeholder: 'aa:bb:cc:dd:ee:ff:...',
        required: true,
      },
      {
        name: 'oraclePrivateKey',
        label: 'Private Key (PEM)',
        type: 'textarea',
        placeholder: '-----BEGIN PRIVATE KEY-----\n...',
        required: true,
      },
      {
        name: 'oracleKeyPassphrase',
        label: 'Key Passphrase',
        type: 'password',
        placeholder: 'Passphrase for private key',
      },
      {
        name: 'oracleRegion',
        label: 'Region',
        type: 'text',
        placeholder: 'us-ashburn-1',
        required: true,
      },
      {
        name: 'oracleCompartmentId',
        label: 'Compartment ID',
        type: 'text',
        placeholder: 'ocid1.compartment.oc1...',
      },
      {
        name: 'oracleServingMode',
        label: 'Serving Mode',
        type: 'select',
        options: [
          { value: 'ON_DEMAND', label: 'On Demand' },
          { value: 'DEDICATED', label: 'Dedicated' },
        ],
      },
    ],
  },

  // Snowflake Cortex
  cortex: {
    fields: [
      ...baseFields,
      {
        name: 'snowflakeAccount',
        label: 'Snowflake Account',
        type: 'text',
        placeholder: 'your-account.snowflakecomputing.com',
        required: true,
      },
    ],
  },
};

/**
 * Get field definitions for a specific provider
 * Falls back to base fields if provider-specific config not found
 */
export function getProviderFields(
  providerId: string
): ProviderFieldDefinition[] {
  const config = providerFieldDefinitions[providerId];
  return config?.fields || baseFields;
}

/**
 * Get required fields for a specific provider
 */
export function getRequiredFields(providerId: string): string[] {
  const fields = getProviderFields(providerId);
  return fields.filter((f) => f.required).map((f) => f.name);
}
