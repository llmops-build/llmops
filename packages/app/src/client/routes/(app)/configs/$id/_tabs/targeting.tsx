import { createFileRoute, useNavigate } from '@tanstack/react-router';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
} from '@ui';
import { useEnvironments } from '@client/hooks/queries/useEnvironments';
import { useTargetingRules } from '@client/hooks/queries/useTargetingRules';
import { variantsContainer } from '../../-components/variants.css';

export const Route = createFileRoute('/(app)/configs/$id/_tabs/targeting')({
  component: RouteComponent,
  staticData: {
    customData: {
      title: 'Targeting',
    },
  },
});

function RouteComponent() {
  const { id: configId } = Route.useParams();
  const { data: environments, isLoading: loadingEnvironments } =
    useEnvironments();
  const { data: targetingRules, isLoading: loadingTargetingRules } =
    useTargetingRules(configId);
  const navigate = useNavigate();

  if (loadingEnvironments || loadingTargetingRules) {
    return <div>Loading...</div>;
  }

  // Create a map of environmentId -> targeting rule for quick lookup
  const rulesByEnv = new Map(
    targetingRules?.map((rule) => [rule.environmentId, rule]) ?? []
  );

  return (
    <div className={variantsContainer}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHeaderCell>Environment</TableHeaderCell>
            <TableHeaderCell>Slug</TableHeaderCell>
            <TableHeaderCell>Active Variant</TableHeaderCell>
            <TableHeaderCell>Variant Version</TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {environments && environments.length > 0 ? (
            environments.map((env) => {
              const rule = rulesByEnv.get(env.id);
              return (
                <TableRow
                  key={env.id}
                  interactive={true}
                  onClick={() =>
                    navigate({
                      to: '/configs/$id/targeting/$environment',
                      params: {
                        id: configId,
                        environment: env.id,
                      },
                    })
                  }
                >
                  <TableCell>
                    {env.name}
                    {env.isProd && (
                      <span style={{ marginLeft: '0.5rem', opacity: 0.6 }}>
                        (prod or this environment)
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{env.slug}</TableCell>
                  <TableCell>
                    {rule ? (
                      <span>{rule.variantName || 'Unnamed'}</span>
                    ) : (
                      <span style={{ opacity: 0.5 }}>Not configured</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {rule ? (
                      rule.pinnedVersion ? (
                        <span>v{rule.pinnedVersion} (pinned)</span>
                      ) : rule.latestVersion ? (
                        <span>v{rule.latestVersion} (latest)</span>
                      ) : (
                        <span style={{ opacity: 0.5 }}>-</span>
                      )
                    ) : (
                      <span style={{ opacity: 0.5 }}>-</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell
                colSpan={4}
                style={{ textAlign: 'center', padding: '2rem' }}
              >
                No environments found. Create an environment to get started.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
