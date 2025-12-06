import { Header } from '@llmops/ui';
import { createFileRoute, Outlet } from '@tanstack/react-router';
import { gridElement } from './-components/area.css';

export const Route = createFileRoute('/_layout/_layout')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <Header></Header>
      <div className={gridElement}>
        <Outlet />
      </div>
    </>
  );
}
