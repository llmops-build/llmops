#!/usr/bin/env tsx

/**
 * Generate normalized model/provider data from Portkey-AI/models raw files.
 *
 * Reads:
 *   - pricing/*.json   (per-provider pricing configs)
 *   - general/*.json   (per-provider model params & capabilities)
 *
 * Outputs:
 *   - generated/pricing.json            — flat { "provider:model": ModelPricing } map
 *   - generated/models-dev-compat.json  — models.dev API-compatible format
 *   - ../../gateway/src/data/models.json    — gateway model list
 *   - ../../gateway/src/data/providers.json — gateway provider list
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const PRICING_DIR = path.join(ROOT, 'pricing');
const GENERAL_DIR = path.join(ROOT, 'general');
const GENERATED_DIR = path.join(ROOT, 'generated');
const GATEWAY_DATA_DIR = path.join(ROOT, '..', 'gateway', 'src', 'data');

// Existing gateway providers.json for preserving descriptions and base_urls
let existingGatewayProviders: Record<
  string,
  { description?: string; base_url?: string }
> = {};
try {
  const existing = JSON.parse(
    fs.readFileSync(path.join(GATEWAY_DATA_DIR, 'providers.json'), 'utf-8')
  );
  if (existing.data) {
    for (const p of existing.data) {
      existingGatewayProviders[p.id] = {
        description: p.description,
        base_url: p.base_url,
      };
    }
  }
} catch {
  // No existing file, will generate from scratch
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PricingPayAsYouGo {
  request_token?: { price: number };
  response_token?: { price: number };
  cache_write_input_token?: { price: number };
  cache_read_input_token?: { price: number };
  cache_read_audio_input_token?: { price: number };
  request_audio_token?: { price: number };
  response_audio_token?: { price: number };
}

interface PricingConfig {
  pricing_config: {
    pay_as_you_go?: PricingPayAsYouGo;
    batch_config?: PricingPayAsYouGo;
    calculate?: unknown;
    currency?: string;
  } | null;
}

type PricingFile = Record<string, PricingConfig>;

interface GeneralModelType {
  primary: string;
  supported?: string[];
}

interface GeneralModelParam {
  key: string;
  defaultValue?: unknown;
  minValue?: number;
  maxValue?: number;
  type?: string;
}

interface GeneralModelEntry {
  params?: GeneralModelParam[];
  removeParams?: string[];
  type?: GeneralModelType;
  messages?: { options: string[] };
}

interface GeneralFile {
  name: string;
  description?: string;
  default?: GeneralModelEntry;
  [modelName: string]: unknown;
}

// Output types
interface ModelPricingOutput {
  inputCostPer1M: number;
  outputCostPer1M: number;
  cacheReadCostPer1M?: number;
  cacheWriteCostPer1M?: number;
}

interface ModelsDevCompatModel {
  id: string;
  name: string;
  tool_call: boolean;
  attachment: boolean;
  reasoning: boolean;
  cost: {
    input: number;
    output: number;
    cache_read?: number;
    cache_write?: number;
  };
  limit: {
    context: number;
    output: number;
  };
}

interface ModelsDevCompatProvider {
  id: string;
  name: string;
  models: Record<string, ModelsDevCompatModel>;
}

type ModelsDevCompatData = Record<string, ModelsDevCompatProvider>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function listJsonFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort();
}

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
}

/**
 * Convert cents-per-token to dollars-per-1M-tokens.
 *   dollars_per_1M = cents_per_token * 1_000_000 / 100 = cents_per_token * 10_000
 */
function centsToDollarsPer1M(centsPerToken: number): number {
  return Math.round(centsPerToken * 10_000 * 1e6) / 1e6; // round to 6 decimals
}

/**
 * Extract max_tokens from general model entry, merging with defaults.
 */
function getMaxTokens(
  modelEntry: GeneralModelEntry | undefined,
  defaults: GeneralModelEntry | undefined
): number {
  // Check model-specific params first
  if (modelEntry?.params) {
    const maxTokenParam = modelEntry.params.find(
      (p) => p.key === 'max_tokens'
    );
    if (maxTokenParam?.maxValue) return maxTokenParam.maxValue;
  }
  // Fall back to defaults
  if (defaults?.params) {
    const maxTokenParam = defaults.params.find((p) => p.key === 'max_tokens');
    if (maxTokenParam?.maxValue) return maxTokenParam.maxValue;
  }
  return 4096; // safe default
}

/**
 * Check if a model supports a given capability from the type.supported array.
 */
function hasCapability(
  modelEntry: GeneralModelEntry | undefined,
  defaults: GeneralModelEntry | undefined,
  capability: string
): boolean {
  const supported = modelEntry?.type?.supported ?? defaults?.type?.supported;
  return supported?.includes(capability) ?? false;
}

/**
 * Prettify provider name from filename.
 * e.g., "azure-openai" -> "Azure OpenAI", "openai" -> "OpenAI"
 */
function prettifyProviderName(id: string, generalName?: string): string {
  if (generalName && generalName !== id) {
    // Capitalize properly
    return generalName
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }
  // Common special cases
  const specialNames: Record<string, string> = {
    openai: 'OpenAI',
    anthropic: 'Anthropic',
    'azure-openai': 'Azure OpenAI',
    'azure-ai': 'Azure AI',
    'together-ai': 'Together AI',
    'mistral-ai': 'Mistral AI',
    'vertex-ai': 'Vertex AI',
    'perplexity-ai': 'Perplexity AI',
    'fireworks-ai': 'Fireworks AI',
    'workers-ai': 'Workers AI',
    'reka-ai': 'Reka AI',
    'novita-ai': 'Novita AI',
    'stability-ai': 'Stability AI',
    'lemonfox-ai': 'Lemonfox AI',
    'featherless-ai': 'Featherless AI',
    'kluster-ai': 'Kluster AI',
    'recraft-ai': 'Recraft AI',
    'inference-net': 'Inference Net',
    'x-ai': 'xAI',
    deepseek: 'DeepSeek',
    deepinfra: 'DeepInfra',
    deepbricks: 'DeepBricks',
    groq: 'Groq',
    cohere: 'Cohere',
    bedrock: 'AWS Bedrock',
    sagemaker: 'AWS SageMaker',
    google: 'Google',
    cerebras: 'Cerebras',
    sambanova: 'SambaNova',
    moonshot: 'Moonshot',
    openrouter: 'OpenRouter',
    ollama: 'Ollama',
    ai21: 'AI21',
    jina: 'Jina',
    nebius: 'Nebius',
    segmind: 'Segmind',
    anyscale: 'Anyscale',
    palm: 'PaLM',
    monsterapi: 'MonsterAPI',
    dashscope: 'DashScope',
    github: 'GitHub',
    siliconflow: 'SiliconFlow',
    upstage: 'Upstage',
    lambda: 'Lambda',
    voyage: 'Voyage',
    nomic: 'Nomic',
    predibase: 'Predibase',
    triton: 'Triton',
    replicate: 'Replicate',
    lepton: 'Lepton',
    nscale: 'NScale',
    hyperbolic: 'Hyperbolic',
    oracle: 'Oracle',
    lingyi: 'Lingyi',
    zhipu: 'Zhipu',
    krutrim: 'Krutrim',
    modal: 'Modal',
    bytez: 'Bytez',
  };

  return (
    specialNames[id] ??
    id
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
  );
}

// ---------------------------------------------------------------------------
// Main generation
// ---------------------------------------------------------------------------

function generate() {
  console.log('Generating model data...\n');

  fs.mkdirSync(GENERATED_DIR, { recursive: true });

  const pricingFiles = listJsonFiles(PRICING_DIR);
  const generalFiles = listJsonFiles(GENERAL_DIR);

  console.log(
    `  Found ${pricingFiles.length} pricing files, ${generalFiles.length} general files\n`
  );

  // Collect all provider IDs from both sources
  const allProviderIds = new Set<string>();
  for (const f of pricingFiles) allProviderIds.add(f.replace('.json', ''));
  for (const f of generalFiles) allProviderIds.add(f.replace('.json', ''));

  // ---------------------------------------------------------------------------
  // Build outputs
  // ---------------------------------------------------------------------------

  const pricingOutput: Record<string, ModelPricingOutput> = {};
  const modelsDevCompat: ModelsDevCompatData = {};
  const gatewayModels: Array<{
    id: string;
    object: string;
    provider: { id: string };
    name: string;
  }> = [];
  const gatewayProviders: Array<{
    id: string;
    name: string;
    object: string;
    description: string;
    base_url: string;
  }> = [];

  for (const providerId of Array.from(allProviderIds).sort()) {
    // Load data files
    const pricingFilePath = path.join(PRICING_DIR, `${providerId}.json`);
    const generalFilePath = path.join(GENERAL_DIR, `${providerId}.json`);

    const pricingData: PricingFile | null = fs.existsSync(pricingFilePath)
      ? readJson<PricingFile>(pricingFilePath)
      : null;
    const generalData: GeneralFile | null = fs.existsSync(generalFilePath)
      ? readJson<GeneralFile>(generalFilePath)
      : null;

    // Get provider name
    const providerName = prettifyProviderName(
      providerId,
      generalData?.name ?? undefined
    );

    // Collect all model names from both sources (excluding "default", "name", "description")
    const reservedKeys = new Set([
      'default',
      'name',
      'description',
    ]);
    const modelNames = new Set<string>();
    if (pricingData) {
      for (const key of Object.keys(pricingData)) {
        if (!reservedKeys.has(key)) modelNames.add(key);
      }
    }
    if (generalData) {
      for (const key of Object.keys(generalData)) {
        if (!reservedKeys.has(key)) modelNames.add(key);
      }
    }

    if (modelNames.size === 0) continue;

    // Get default pricing and general configs
    const defaultPricing = pricingData?.default?.pricing_config?.pay_as_you_go;
    const defaultGeneral = generalData?.default as
      | GeneralModelEntry
      | undefined;

    // Build models.dev compat provider
    const compatModels: Record<string, ModelsDevCompatModel> = {};

    for (const modelName of Array.from(modelNames).sort()) {
      // --- Pricing ---
      const modelPricing =
        pricingData?.[modelName]?.pricing_config?.pay_as_you_go;

      // Use model pricing, fall back to default, then 0
      const inputCents =
        modelPricing?.request_token?.price ??
        defaultPricing?.request_token?.price ??
        0;
      const outputCents =
        modelPricing?.response_token?.price ??
        defaultPricing?.response_token?.price ??
        0;
      const cacheReadCents =
        modelPricing?.cache_read_input_token?.price ??
        defaultPricing?.cache_read_input_token?.price;
      const cacheWriteCents =
        modelPricing?.cache_write_input_token?.price ??
        defaultPricing?.cache_write_input_token?.price;

      const inputCostPer1M = centsToDollarsPer1M(inputCents);
      const outputCostPer1M = centsToDollarsPer1M(outputCents);
      const cacheReadCostPer1M =
        cacheReadCents != null ? centsToDollarsPer1M(cacheReadCents) : undefined;
      const cacheWriteCostPer1M =
        cacheWriteCents != null
          ? centsToDollarsPer1M(cacheWriteCents)
          : undefined;

      // Store in pricing output
      const pricingKey = `${providerId}:${modelName}`;
      const pricingEntry: ModelPricingOutput = {
        inputCostPer1M,
        outputCostPer1M,
      };
      if (cacheReadCostPer1M !== undefined)
        pricingEntry.cacheReadCostPer1M = cacheReadCostPer1M;
      if (cacheWriteCostPer1M !== undefined)
        pricingEntry.cacheWriteCostPer1M = cacheWriteCostPer1M;
      pricingOutput[pricingKey] = pricingEntry;

      // --- General / capabilities ---
      const modelGeneral = generalData?.[modelName] as
        | GeneralModelEntry
        | undefined;
      const maxTokens = getMaxTokens(modelGeneral, defaultGeneral);
      const hasTools = hasCapability(modelGeneral, defaultGeneral, 'tools');
      const hasImage = hasCapability(modelGeneral, defaultGeneral, 'image');

      // Build models.dev compat model entry
      const costEntry: ModelsDevCompatModel['cost'] = {
        input: inputCostPer1M,
        output: outputCostPer1M,
      };
      if (cacheReadCostPer1M !== undefined)
        costEntry.cache_read = cacheReadCostPer1M;
      if (cacheWriteCostPer1M !== undefined)
        costEntry.cache_write = cacheWriteCostPer1M;

      compatModels[modelName] = {
        id: modelName,
        name: modelName,
        tool_call: hasTools,
        attachment: hasImage,
        reasoning: false,
        cost: costEntry,
        limit: {
          context: maxTokens * 4, // rough estimate; context is typically larger than output
          output: maxTokens,
        },
      };

      // Gateway model entry
      gatewayModels.push({
        id: modelName,
        object: 'model',
        provider: { id: providerId },
        name: modelName,
      });
    }

    modelsDevCompat[providerId] = {
      id: providerId,
      name: providerName,
      models: compatModels,
    };

    // Gateway provider entry
    const existing = existingGatewayProviders[providerId];
    gatewayProviders.push({
      id: providerId,
      name: providerName,
      object: 'provider',
      description: existing?.description ?? '',
      base_url: existing?.base_url ?? '',
    });
  }

  // ---------------------------------------------------------------------------
  // Write output files
  // ---------------------------------------------------------------------------

  // 1. Pricing map
  const pricingPath = path.join(GENERATED_DIR, 'pricing.json');
  fs.writeFileSync(pricingPath, JSON.stringify(pricingOutput, null, 2));
  console.log(
    `  Written ${Object.keys(pricingOutput).length} model pricing entries -> generated/pricing.json`
  );

  // 2. Models.dev compat
  const compatPath = path.join(GENERATED_DIR, 'models-dev-compat.json');
  fs.writeFileSync(compatPath, JSON.stringify(modelsDevCompat, null, 2));
  const providerCount = Object.keys(modelsDevCompat).length;
  const modelCount = Object.values(modelsDevCompat).reduce(
    (acc, p) => acc + Object.keys(p.models).length,
    0
  );
  console.log(
    `  Written ${providerCount} providers, ${modelCount} models -> generated/models-dev-compat.json`
  );

  // 3. Gateway models.json
  if (fs.existsSync(GATEWAY_DATA_DIR)) {
    const gatewayModelsPath = path.join(GATEWAY_DATA_DIR, 'models.json');
    fs.writeFileSync(
      gatewayModelsPath,
      JSON.stringify(
        { object: 'list', version: '1.0.0', data: gatewayModels },
        null,
        2
      )
    );
    console.log(
      `  Written ${gatewayModels.length} models -> gateway/src/data/models.json`
    );

    // 4. Gateway providers.json
    const gatewayProvidersPath = path.join(GATEWAY_DATA_DIR, 'providers.json');
    fs.writeFileSync(
      gatewayProvidersPath,
      JSON.stringify(
        { object: 'list', version: '1.0.0', data: gatewayProviders },
        null,
        2
      )
    );
    console.log(
      `  Written ${gatewayProviders.length} providers -> gateway/src/data/providers.json`
    );
  } else {
    console.log(
      '  Skipping gateway data files (gateway/src/data/ not found)'
    );
  }

  console.log('\nDone!');
}

generate();
