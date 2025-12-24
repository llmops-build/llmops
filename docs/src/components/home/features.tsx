import { clsx } from 'clsx';
import { useState } from 'react';
import styles from './home.module.css';

const tabs = ['Features', 'Middlewares', 'Integrations', 'Providers'] as const;

type CardItem = {
  name: string;
  description: string;
  comingSoon?: boolean;
};

const features: CardItem[] = [
  {
    name: 'Prompt Management',
    description:
      'Version, test, and deploy prompts with a visual editor and OpenAI-compatible API.',
  },
  {
    name: 'Cost Tracking',
    description:
      'Monitor and analyze LLM usage costs across providers and models.',
    comingSoon: true,
  },
  {
    name: 'Observability',
    description:
      'Trace requests, debug issues, and gain insights into your LLM pipelines.',
    comingSoon: true,
  },
];

const middlewares: CardItem[] = [
  {
    name: 'Express',
    description:
      'Integrate LLMOps with your Express.js applications using our middleware.',
  },
  {
    name: 'Hono',
    description:
      'Lightweight middleware for Hono framework with full TypeScript support.',
    comingSoon: true,
  },
  {
    name: 'Next.js',
    description:
      'Seamless integration with Next.js API routes and server actions.',
    comingSoon: true,
  },
  {
    name: 'NestJS',
    description: 'Decorator-based integration for NestJS applications.',
    comingSoon: true,
  },
];

const integrations: CardItem[] = [
  {
    name: 'Cloudflare Stack',
    description: 'D1 database, Workers, and AI Gateway integration.',
    comingSoon: true,
  },
  {
    name: 'Vercel Stack',
    description: 'Postgres, Edge Functions, and AI Gateway integration.',
    comingSoon: true,
  },
];

const providers: CardItem[] = [
  {
    name: 'OpenRouter',
    description: 'Access 100+ models through a single API endpoint.',
  },
  {
    name: 'OpenAI',
    description: 'GPT-4, GPT-3.5, and other OpenAI models.',
    comingSoon: true,
  },
  {
    name: 'Anthropic',
    description: 'Claude models for safe and helpful AI assistants.',
    comingSoon: true,
  },
  {
    name: 'Azure OpenAI',
    description: 'Enterprise-grade OpenAI models on Azure infrastructure.',
    comingSoon: true,
  },
  {
    name: 'Google Vertex AI',
    description: 'Gemini and PaLM models on Google Cloud.',
    comingSoon: true,
  },
  {
    name: 'AWS Bedrock',
    description: 'Foundation models from AWS including Claude and Titan.',
    comingSoon: true,
  },
  {
    name: 'Groq',
    description: 'Ultra-fast inference with LPU technology.',
    comingSoon: true,
  },
  {
    name: 'Mistral AI',
    description: 'Open and efficient language models from Mistral.',
    comingSoon: true,
  },
  {
    name: 'Cohere',
    description: 'Enterprise AI models for text generation and embeddings.',
    comingSoon: true,
  },
  {
    name: 'Together AI',
    description: 'Open-source models with fast inference.',
    comingSoon: true,
  },
  {
    name: 'DeepSeek',
    description: 'Advanced reasoning and coding models.',
    comingSoon: true,
  },
];

const FeatureCard = ({ item }: { item: CardItem }) => (
  <div
    className={clsx(
      'flex flex-col gap-2 p-4 rounded-lg border',
      item.comingSoon
        ? ['border-gray-4 bg-gray-2', styles.comingSoonPattern]
        : 'border-accent-4 bg-accent-2'
    )}
  >
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-gray-12">{item.name}</span>
      {item.comingSoon && (
        <span className="text-xs text-accent-10 bg-accent-4 px-2 py-0.5 rounded">
          Coming Soon
        </span>
      )}
    </div>
    <p className="text-xs text-gray-10">{item.description}</p>
  </div>
);

const Section = ({ title, items }: { title: string; items: CardItem[] }) => (
  <div className="w-full">
    <h2 className="text-sm font-mono text-gray-8 mb-3">{title}</h2>
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <FeatureCard key={item.name} item={item} />
      ))}
    </div>
  </div>
);

const Features = () => {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>('Features');

  const getItems = () => {
    switch (activeTab) {
      case 'Features':
        return features;
      case 'Middlewares':
        return middlewares;
      case 'Integrations':
        return integrations;
      case 'Providers':
        return providers;
      default:
        return [];
    }
  };

  return (
    <div
      className={clsx(
        'max-w-4xl mx-auto flex flex-col w-full items-center justify-stretch px-4 lg:px-8 py-16',
        styles.features
      )}
    >
      {/* Mobile: Stacked sections */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 w-full md:hidden">
        <Section title="Features" items={features} />
        <Section title="Middlewares" items={middlewares} />
        <Section title="Integrations" items={integrations} />
        <Section title="Providers" items={providers} />
      </div>

      {/* Desktop: Tabs */}
      <div className="max-w-sm w-full hidden md:block">
        <div className="flex items-center justify-center h-10 border-b border-gray-4 px-2 gap-2 w-full">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={clsx(
                'flex items-center px-2 py-1 text-sm font-mono rounded cursor-pointer transition-all duration-200 border-none bg-transparent text-gray-8 hover:bg-gray-3',
                activeTab === tab && 'bg-gray-4 text-gray-12'
              )}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-3 py-4">
          {getItems().map((item) => (
            <FeatureCard key={item.name} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Features;
