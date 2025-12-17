import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_layout/_layout/configs/_configs/$id/_variants/variants/$variant',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div>
      Hello "/_layout/_layout/configs/_configs/$id/_variants/varaints/$id"!
    </div>
  )
}
