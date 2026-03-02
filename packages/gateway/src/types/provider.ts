export interface ProviderConfig {
  provider: string;
  apiKey?: string;
  /** Base URL for the provider API (takes precedence over customHost) */
  baseURL?: string;
  /** @deprecated Use baseURL instead */
  customHost?: string;

  /** Headers to forward as-is to the provider */
  forwardHeaders?: string[];
  /** Per-request timeout in ms */
  requestTimeout?: number;

  // OpenAI
  openaiOrganization?: string;
  openaiProject?: string;
  openaiBeta?: string;

  // Anthropic
  anthropicBeta?: string;
  anthropicVersion?: string;
  anthropicApiKey?: string;

  // AWS (Bedrock / SageMaker)
  awsAccessKeyId?: string;
  awsSecretAccessKey?: string;
  awsSessionToken?: string;
  awsRegion?: string;
  awsRoleArn?: string;
  awsExternalId?: string;
  awsBedrockModel?: string;
  awsS3Bucket?: string;
  awsS3ObjectKey?: string;
  awsService?: string;
  awsAuthType?: string;
  awsServerSideEncryption?: string;
  awsServerSideEncryptionKmsKeyId?: string;

  // SageMaker
  amznSagemakerCustomAttributes?: string;
  amznSagemakerTargetModel?: string;
  amznSagemakerTargetVariant?: string;
  amznSagemakerTargetContainerHostname?: string;
  amznSagemakerInferenceId?: string;
  amznSagemakerEnableExplanations?: string;
  amznSagemakerInferenceComponent?: string;
  amznSagemakerSessionId?: string;
  amznSagemakerModelName?: string;

  // Azure OpenAI
  azureResourceName?: string;
  azureDeploymentId?: string;
  azureApiVersion?: string;
  azureAuthMode?: string;
  azureAdToken?: string;
  azureManagedClientId?: string;
  azureWorkloadClientId?: string;
  azureEntraClientId?: string;
  azureEntraClientSecret?: string;
  azureEntraTenantId?: string;
  azureEntraScope?: string;
  azureFoundryUrl?: string;
  azureDeploymentName?: string;
  azureModelName?: string;
  azureExtraParameters?: string;

  // Google Vertex AI
  vertexProjectId?: string;
  vertexRegion?: string;
  vertexServiceAccountJson?: Record<string, string>;
  vertexStorageBucketName?: string;
  vertexModelName?: string;
  vertexAuthType?: string;

  // Cloudflare Workers AI
  workersAiAccountId?: string;

  // Stability AI
  stabilityClientId?: string;
  stabilityClientUserId?: string;
  stabilityClientVersion?: string;

  // Hugging Face
  huggingfaceBaseUrl?: string;

  // Mistral
  mistralFimCompletion?: string;

  // Fireworks
  fireworksAccountId?: string;

  // Cortex (Snowflake)
  snowflakeAccount?: string;

  // Oracle Cloud
  oracleApiVersion?: string;
  oracleRegion?: string;
  oracleCompartmentId?: string;
  oracleServingMode?: string;
  oracleTenancy?: string;
  oracleUser?: string;
  oracleFingerprint?: string;
  oraclePrivateKey?: string;
  oracleKeyPassphrase?: string;

  // Databricks
  databricksWorkspace?: string;
}
