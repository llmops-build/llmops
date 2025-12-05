import { Area, Header } from '@llmops/ui';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <Header></Header>
      <Area></Area>
    </>
  );
}
