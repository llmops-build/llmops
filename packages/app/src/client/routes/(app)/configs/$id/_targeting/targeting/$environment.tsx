import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/(app)/configs/$id/_targeting/targeting/$environment',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div>Hello "/(app)/configs/$id/_targeting/targeting/$environment"!</div>
  )
}
