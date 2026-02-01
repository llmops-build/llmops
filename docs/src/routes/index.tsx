import Header from '@/components/home/header';
import './-styles/base.css';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: Home,
});

function Home() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden px-6 xl:px-0">
      <div className="max-w-7xl w-full xl:mx-auto border-x border-gray-4 flex flex-col">
        <Header />
      </div>
    </div>
  );
}
