import { createFileRoute, useNavigate } from '@tanstack/react-router';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
  Button,
} from '@ui';
import { useConfigVariants } from '@client/hooks/queries/useConfigVariants';
import { Icon } from '@client/components/icons';
import { Plus } from 'lucide-react';
import {
  variantsContainer,
  variantsHeader,
} from '../../-components/variants.css';
import { useQueryClient } from '@tanstack/react-query';
import { variantByIdQueryOptions } from '@client/hooks/queries/useVariantById';

export const Route = createFileRoute('/(app)/configs/$id/_tabs/variants')({
  component: RouteComponent,
  staticData: {
    customData: {
      title: 'Variants',
    },
  },
});

function RouteComponent() {
  const { id: configId } = Route.useParams();
  const queryClient = useQueryClient();
  const { data: configVariants, isLoading: loadingConfigVariants } =
    useConfigVariants(configId);
  const navigate = useNavigate();

  if (loadingConfigVariants) {
    return <div>Loading variants...</div>;
  }

  return (
    <div className={variantsContainer}>
      <div className={variantsHeader}>
        <Button
          variant="ghost"
          onClick={() => {
            navigate({
              to: '/configs/$id/variants/$variant',
              params: {
                id: configId,
                variant: 'new',
              },
            });
          }}
        >
          <Icon icon={Plus} />
          Add Variant
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHeaderCell>Name</TableHeaderCell>
            <TableHeaderCell>Provider</TableHeaderCell>
            <TableHeaderCell>Model</TableHeaderCell>
            <TableHeaderCell>Current Version</TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {configVariants && configVariants.length > 0 ? (
            configVariants.map((variant) => (
              <TableRow
                key={variant.variantId}
                interactive={true}
                onMouseEnter={() => {
                  queryClient.prefetchQuery(
                    variantByIdQueryOptions(variant.variantId)
                  );
                }}
                onClick={() =>
                  navigate({
                    to: '/configs/$id/variants/$variant',
                    params: {
                      id: configId,
                      variant: variant.variantId,
                    },
                  })
                }
              >
                <TableCell>{variant.name || 'Unnamed Variant'}</TableCell>
                <TableCell>{variant.provider || 'Unknown'}</TableCell>
                <TableCell>{variant.modelName || 'Unknown'}</TableCell>
                <TableCell>
                  {variant.latestVersion?.version
                    ? `v${variant.latestVersion.version}`
                    : '-'}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={4}
                style={{ textAlign: 'center', padding: '2rem' }}
              >
                No variants added yet. Click "Add Variant" to get started.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
