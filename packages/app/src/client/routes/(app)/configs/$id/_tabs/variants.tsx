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
import { useRemoveVariantFromConfig } from '@client/hooks/mutations/useRemoveVariantFromConfig';
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
  const removeVariant = useRemoveVariantFromConfig();
  const navigate = useNavigate();

  const handleDelete = (variantId: string) => {
    if (confirm('Are you sure you want to remove this variant?')) {
      removeVariant.mutate({ configId, variantId });
    }
  };

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
            <TableHeaderCell>Model</TableHeaderCell>
            <TableHeaderCell>Provider</TableHeaderCell>
            <TableHeaderCell>Configuration</TableHeaderCell>
            <TableHeaderCell>Actions</TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {configVariants && configVariants.length > 0 ? (
            configVariants.map((variant) => (
              <TableRow key={variant.id}>
                <TableCell>{variant.modelName || 'Unknown'}</TableCell>
                <TableCell>{variant.provider || 'Unknown'}</TableCell>
                <TableCell>
                  {variant.jsonData
                    ? Object.entries(variant.jsonData)
                        .map(([key, value]) => `${key}: ${value}`)
                        .join(', ')
                    : '-'}
                </TableCell>
                <TableCell>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button onClick={() => handleDelete(variant.variantId)}>
                      Remove
                    </Button>
                  </div>
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
