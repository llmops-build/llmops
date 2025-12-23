import { clsx } from 'clsx';
import styles from './home.module.css';

const features = [
  {
    title: 'Provider Agnostic',
    description:
      'Support for multiple LLM providers including OpenRouter, OpenAI, Anthropic, and more. Switch providers without changing your code.',
  },
  {
    title: 'Built-in Observability',
    description:
      'Track usage, monitor performance, and debug issues with built-in logging and analytics dashboards.',
  },
  {
    title: 'Database Persistence',
    description:
      'Store conversations, prompts, and analytics in PostgreSQL with built-in schema management.',
  },
];

const Features = () => {
  return (
    <div
      className={clsx(
        'max-w-6xl mx-auto flex w-full items-center justify-stretch px-4 lg:px-8 border-x border-dashed border-gray-6 py-16',
        styles.features
      )}
    >
      <div className="w-full">
        <h2 className="text-xl text-gray-12 font-medium mb-8 text-center">
          Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="border border-solid border-gray-4 rounded-md p-6 bg-gray-2"
            >
              <h3 className="text-base text-gray-12 font-medium mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-11 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Features;
