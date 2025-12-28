import { SupportedProviders } from './supported-providers';

/**
 * Base provider configuration - all providers require at least an API key
 */
export interface BaseProviderConfig {
  /** The API key for authentication */
  apiKey: string;
  /** Custom base URL for the provider */
  customHost?: string;
  /** Request timeout in milliseconds */
  requestTimeout?: number;
  /** Headers to forward to the provider */
  forwardHeaders?: string[];
}

/**
 * OpenAI-specific configuration
 */
export interface OpenAIProviderConfig extends BaseProviderConfig {
  /** OpenAI organization ID */
  openaiOrganization?: string;
  /** OpenAI project ID */
  openaiProject?: string;
  /** OpenAI beta features header */
  openaiBeta?: string;
}

/**
 * Anthropic-specific configuration
 */
export interface AnthropicProviderConfig extends BaseProviderConfig {
  /** Anthropic beta features header */
  anthropicBeta?: string;
  /** Anthropic API version */
  anthropicVersion?: string;
}

/**
 * Azure OpenAI-specific configuration
 */
export interface AzureOpenAIProviderConfig extends BaseProviderConfig {
  /** Azure resource name */
  resourceName?: string;
  /** Azure deployment ID */
  deploymentId?: string;
  /** Azure API version */
  apiVersion?: string;
  /** Azure model name */
  azureModelName?: string;
  /** Azure authentication mode: 'apiKey' | 'entra' | 'managed' | 'workload' */
  azureAuthMode?: string;
  /** Azure AD token for authentication */
  azureAdToken?: string;
  /** Azure managed identity client ID */
  azureManagedClientId?: string;
  /** Azure workload identity client ID */
  azureWorkloadClientId?: string;
  /** Azure Entra client ID */
  azureEntraClientId?: string;
  /** Azure Entra client secret */
  azureEntraClientSecret?: string;
  /** Azure Entra tenant ID */
  azureEntraTenantId?: string;
  /** Azure Entra scope */
  azureEntraScope?: string;
}

/**
 * Azure AI (Foundry) specific configuration
 */
export interface AzureAIProviderConfig extends BaseProviderConfig {
  /** Azure API version */
  azureApiVersion?: string;
  /** Azure Foundry URL */
  azureFoundryUrl?: string;
  /** Azure deployment name */
  azureDeploymentName?: string;
  /** Extra parameters for Azure */
  azureExtraParameters?: string;
}

/**
 * AWS Bedrock-specific configuration
 */
export interface BedrockProviderConfig extends BaseProviderConfig {
  /** AWS secret access key */
  awsSecretAccessKey?: string;
  /** AWS access key ID */
  awsAccessKeyId?: string;
  /** AWS session token (for temporary credentials) */
  awsSessionToken?: string;
  /** AWS region (e.g., 'us-east-1') */
  awsRegion?: string;
  /** AWS authentication type: 'assumedRole' | 'apiKey' */
  awsAuthType?: string;
  /** AWS role ARN for assumed role authentication */
  awsRoleArn?: string;
  /** AWS external ID for cross-account access */
  awsExternalId?: string;
  /** AWS Bedrock model ID */
  awsBedrockModel?: string;
}

/**
 * AWS Sagemaker-specific configuration
 */
export interface SagemakerProviderConfig extends BedrockProviderConfig {
  /** Sagemaker custom attributes */
  amznSagemakerCustomAttributes?: string;
  /** Sagemaker target model */
  amznSagemakerTargetModel?: string;
  /** Sagemaker target variant */
  amznSagemakerTargetVariant?: string;
  /** Sagemaker target container hostname */
  amznSagemakerTargetContainerHostname?: string;
  /** Sagemaker inference ID */
  amznSagemakerInferenceId?: string;
  /** Sagemaker enable explanations */
  amznSagemakerEnableExplanations?: string;
  /** Sagemaker inference component */
  amznSagemakerInferenceComponent?: string;
  /** Sagemaker session ID */
  amznSagemakerSessionId?: string;
  /** Sagemaker model name */
  amznSagemakerModelName?: string;
  /** AWS S3 bucket for file operations */
  awsS3Bucket?: string;
  /** AWS S3 object key */
  awsS3ObjectKey?: string;
}

/**
 * Google Vertex AI-specific configuration
 */
export interface VertexAIProviderConfig extends BaseProviderConfig {
  /** Vertex AI region (e.g., 'us-central1') */
  vertexRegion?: string;
  /** Vertex AI project ID */
  vertexProjectId?: string;
  /** Vertex AI service account JSON credentials */
  vertexServiceAccountJson?: Record<string, unknown>;
  /** Vertex AI storage bucket name */
  vertexStorageBucketName?: string;
  /** Vertex AI model name */
  vertexModelName?: string;
}

/**
 * Google AI (Gemini) configuration
 */
export interface GoogleProviderConfig extends BaseProviderConfig {
  // Uses standard API key authentication
}

/**
 * Cloudflare Workers AI-specific configuration
 */
export interface WorkersAIProviderConfig extends BaseProviderConfig {
  /** Cloudflare account ID */
  workersAiAccountId?: string;
}

/**
 * Stability AI-specific configuration
 */
export interface StabilityAIProviderConfig extends BaseProviderConfig {
  /** Stability client ID */
  stabilityClientId?: string;
  /** Stability client user ID */
  stabilityClientUserId?: string;
  /** Stability client version */
  stabilityClientVersion?: string;
}

/**
 * Hugging Face-specific configuration
 */
export interface HuggingFaceProviderConfig extends BaseProviderConfig {
  /** Hugging Face base URL for inference endpoints */
  huggingfaceBaseUrl?: string;
}

/**
 * Fireworks AI-specific configuration
 */
export interface FireworksAIProviderConfig extends BaseProviderConfig {
  /** Fireworks account ID */
  fireworksAccountId?: string;
}

/**
 * Mistral AI-specific configuration
 */
export interface MistralAIProviderConfig extends BaseProviderConfig {
  /** Use FIM completions endpoint */
  mistralFimCompletion?: string;
}

/**
 * Oracle Cloud-specific configuration
 */
export interface OracleProviderConfig extends BaseProviderConfig {
  /** Oracle API version (e.g., '20160918') */
  oracleApiVersion?: string;
  /** Oracle region (e.g., 'us-ashburn-1') */
  oracleRegion?: string;
  /** Oracle compartment ID */
  oracleCompartmentId?: string;
  /** Oracle serving mode: 'ON_DEMAND' | 'DEDICATED' */
  oracleServingMode?: string;
  /** Oracle tenancy OCID */
  oracleTenancy?: string;
  /** Oracle user OCID */
  oracleUser?: string;
  /** Oracle API key fingerprint */
  oracleFingerprint?: string;
  /** Oracle private key (PEM format) */
  oraclePrivateKey?: string;
  /** Oracle key passphrase */
  oracleKeyPassphrase?: string;
}

/**
 * Snowflake Cortex-specific configuration
 */
export interface CortexProviderConfig extends BaseProviderConfig {
  /** Snowflake account identifier */
  snowflakeAccount?: string;
}

/**
 * Provider config type mapping - maps each provider to its specific config type
 */
export interface ProviderConfigMap {
  [SupportedProviders.OPENAI]: OpenAIProviderConfig;
  [SupportedProviders.ANTHROPIC]: AnthropicProviderConfig;
  [SupportedProviders.AZURE_OPENAI]: AzureOpenAIProviderConfig;
  [SupportedProviders.AZURE_AI]: AzureAIProviderConfig;
  [SupportedProviders.BEDROCK]: BedrockProviderConfig;
  [SupportedProviders.SAGEMAKER]: SagemakerProviderConfig;
  [SupportedProviders.VERTEX_AI]: VertexAIProviderConfig;
  [SupportedProviders.GOOGLE]: GoogleProviderConfig;
  [SupportedProviders.WORKERS_AI]: WorkersAIProviderConfig;
  [SupportedProviders.STABILITY_AI]: StabilityAIProviderConfig;
  [SupportedProviders.HUGGINGFACE]: HuggingFaceProviderConfig;
  [SupportedProviders.FIREWORKS_AI]: FireworksAIProviderConfig;
  [SupportedProviders.MISTRAL_AI]: MistralAIProviderConfig;
  [SupportedProviders.ORACLE]: OracleProviderConfig;
  // All other providers use the base config
  [SupportedProviders.COHERE]: BaseProviderConfig;
  [SupportedProviders.ANYSCALE]: BaseProviderConfig;
  [SupportedProviders.PALM]: BaseProviderConfig;
  [SupportedProviders.TOGETHER_AI]: BaseProviderConfig;
  [SupportedProviders.PERPLEXITY_AI]: BaseProviderConfig;
  [SupportedProviders.DEEPINFRA]: BaseProviderConfig;
  [SupportedProviders.NCOMPASS]: BaseProviderConfig;
  [SupportedProviders.NOMIC]: BaseProviderConfig;
  [SupportedProviders.OLLAMA]: BaseProviderConfig;
  [SupportedProviders.AI21]: BaseProviderConfig;
  [SupportedProviders.GROQ]: BaseProviderConfig;
  [SupportedProviders.SEGMIND]: BaseProviderConfig;
  [SupportedProviders.JINA]: BaseProviderConfig;
  [SupportedProviders.REKA_AI]: BaseProviderConfig;
  [SupportedProviders.MOONSHOT]: BaseProviderConfig;
  [SupportedProviders.OPENROUTER]: BaseProviderConfig;
  [SupportedProviders.LINGYI]: BaseProviderConfig;
  [SupportedProviders.ZHIPU]: BaseProviderConfig;
  [SupportedProviders.NOVITA_AI]: BaseProviderConfig;
  [SupportedProviders.MONSTERAPI]: BaseProviderConfig;
  [SupportedProviders.DEEPSEEK]: BaseProviderConfig;
  [SupportedProviders.PREDIBASE]: BaseProviderConfig;
  [SupportedProviders.TRITON]: BaseProviderConfig;
  [SupportedProviders.VOYAGE]: BaseProviderConfig;
  [SupportedProviders.GITHUB]: BaseProviderConfig;
  [SupportedProviders.DEEPBRICKS]: BaseProviderConfig;
  [SupportedProviders.SILICONFLOW]: BaseProviderConfig;
  [SupportedProviders.CEREBRAS]: BaseProviderConfig;
  [SupportedProviders.INFERENCE_NET]: BaseProviderConfig;
  [SupportedProviders.SAMBANOVA]: BaseProviderConfig;
  [SupportedProviders.LEMONFOX_AI]: BaseProviderConfig;
  [SupportedProviders.UPSTAGE]: BaseProviderConfig;
  [SupportedProviders.LAMBDA]: BaseProviderConfig;
  [SupportedProviders.DASHSCOPE]: BaseProviderConfig;
  [SupportedProviders.X_AI]: BaseProviderConfig;
  [SupportedProviders.QDRANT]: BaseProviderConfig;
  [SupportedProviders.NEBIUS]: BaseProviderConfig;
  [SupportedProviders.RECRAFT_AI]: BaseProviderConfig;
  [SupportedProviders.MILVUS]: BaseProviderConfig;
  [SupportedProviders.REPLICATE]: BaseProviderConfig;
  [SupportedProviders.LEPTON]: BaseProviderConfig;
  [SupportedProviders.KLUSTER_AI]: BaseProviderConfig;
  [SupportedProviders.NSCALE]: BaseProviderConfig;
  [SupportedProviders.HYPERBOLIC]: BaseProviderConfig;
  [SupportedProviders.BYTEZ]: BaseProviderConfig;
  [SupportedProviders.FEATHERLESS_AI]: BaseProviderConfig;
  [SupportedProviders.KRUTRIM]: BaseProviderConfig;
  [SupportedProviders.AI302]: BaseProviderConfig;
  [SupportedProviders.COMETAPI]: BaseProviderConfig;
  [SupportedProviders.MATTERAI]: BaseProviderConfig;
  [SupportedProviders.MESHY]: BaseProviderConfig;
  [SupportedProviders.NEXTBIT]: BaseProviderConfig;
  [SupportedProviders.TRIPO3D]: BaseProviderConfig;
  [SupportedProviders.MODAL]: BaseProviderConfig;
  [SupportedProviders.Z_AI]: BaseProviderConfig;
  [SupportedProviders.IOINTELLIGENCE]: BaseProviderConfig;
  [SupportedProviders.AIBADGR]: BaseProviderConfig;
}

/**
 * Union of all possible provider configs
 */
export type AnyProviderConfig = ProviderConfigMap[SupportedProviders];

/**
 * Partial provider configurations - all providers are optional
 */
export type ProvidersConfig = {
  [K in SupportedProviders]?: ProviderConfigMap[K];
};
