import Header from '@/components/home/header';
import './-styles/base.css';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: Home,
});

function Home() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl w-full mx-auto border-x border-gray-4">
        <Header />
      </div>
    </div>
  );
}
