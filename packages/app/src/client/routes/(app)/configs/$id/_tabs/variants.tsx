import { createFileRoute, useNavigate } from '@tanstack/react-router';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
  Button,
} from '@llmops/ui';
import { useConfigVariants } from '@client/hooks/queries/useConfigVariants';
import { Icon } from '@client/components/icons';
import { Plus } from 'lucide-react';
import {
  variantsContainer,
  variantsHeader,
} from '../../-components/variants.css';

export const Route = createFileRoute('/(app)/configs/$id/_tabs/variants')({
  component: RouteComponent,
});

function RouteComponent() {
  const { id: configId } = Route.useParams();
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
          </TableRow>
        </TableHeader>
        <TableBody>
          {configVariants && configVariants.length > 0 ? (
            configVariants.map((variant) => (
              <TableRow
                key={variant.variantId}
                interactive={true}
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
