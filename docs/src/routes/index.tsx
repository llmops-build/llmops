import './-styles/base.css';
import Features from '@/components/home/features';
import Hero from '@/components/home/hero';
import { baseOptions } from '@/lib/layout.shared';
import { createFileRoute } from '@tanstack/react-router';
import { HomeLayout } from 'fumadocs-ui/layouts/home';

export const Route = createFileRoute('/')({
  component: Home,
});

function Home() {
  return (
    <HomeLayout {...baseOptions()}>
      <Hero />
      <Features />
    </HomeLayout>
  );
}
