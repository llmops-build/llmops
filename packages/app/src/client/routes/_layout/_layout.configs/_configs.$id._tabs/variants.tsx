import { createFileRoute } from '@tanstack/react-router';
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
import { useVariantList } from '@client/hooks/queries/useVariantList';
import { useRemoveVariantFromConfig } from '@client/hooks/mutations/useRemoveVariantFromConfig';
import { Icon } from '@client/components/icons';
import { Plus } from 'lucide-react';
import { variantsContainer, variantsHeader } from '../-components/variants.css';

export const Route = createFileRoute(
  '/_layout/_layout/configs/_configs/$id/_tabs/variants'
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { id: configId } = Route.useParams();
  const { data: configVariants, isLoading: loadingConfigVariants } =
    useConfigVariants(configId);
  const { data: allVariants } = useVariantList();
  const removeVariant = useRemoveVariantFromConfig();

  // Create a map of variant IDs to variant details
  const variantsMap = new Map(allVariants?.map((v) => [v.id, v]) || []);

  // Get full variant details for config variants
  const variantsWithDetails = configVariants?.map((cv) => ({
    configVariantId: cv.id,
    variantId: cv.variantId,
    variant: variantsMap.get(cv.variantId),
  }));

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
        <Button variant="ghost">
          <Icon icon={Plus} />
          Add Variant
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHeaderCell>Name</TableHeaderCell>
            <TableHeaderCell>Model</TableHeaderCell>
            <TableHeaderCell>Provider</TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {variantsWithDetails && variantsWithDetails.length > 0 ? (
            variantsWithDetails.map((item) => (
              <TableRow key={item.configVariantId}>
                <TableCell>{item.variant?.modelName || 'Unknown'}</TableCell>
                <TableCell>{item.variant?.provider || 'Unknown'}</TableCell>
                <TableCell>
                  {item.variant?.jsonData
                    ? Object.entries(item.variant.jsonData)
                        .map(([key, value]) => `${key}: ${value}`)
                        .join(', ')
                    : '-'}
                </TableCell>
                <TableCell>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button onClick={() => handleDelete(item.variantId)}>
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
