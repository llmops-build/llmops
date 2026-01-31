import './-styles/base.css';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: Home,
});

function Home() {
  return (
    // <HomeLayout
    //   {...baseOptions({
    //     noTitle: true,
    //   })}
    //   nav={{ enabled: false }}
    // >
    //   {/* Redesign content here */}
    // </HomeLayout>
    <div></div>
  );
}
