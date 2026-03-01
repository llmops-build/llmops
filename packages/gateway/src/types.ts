export interface ProviderConfig {
  provider: string;
  apiKey?: string;
  customHost?: string;

  // OpenAI
  openaiOrganization?: string;
  openaiProject?: string;

  // AWS (Bedrock)
  awsAccessKeyId?: string;
  awsSecretAccessKey?: string;
  awsSessionToken?: string;
  awsRegion?: string;

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
  azureFoundryUrl?: string;
  azureDeploymentName?: string;

  // Vertex AI
  vertexProjectId?: string;
  vertexRegion?: string;
  vertexServiceAccountJson?: Record<string, string>;
}
