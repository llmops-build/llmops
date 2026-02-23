import { useNavigate } from '@tanstack/react-router';
import { Icon } from '@client/components/icons';
import { X, ChevronRight, ChevronDown, Loader2 } from 'lucide-react';
import { Button } from '@ui';
import { useState, useMemo } from 'react';
import {
  useTraceDetail,
  type SpanRow,
  type SpanEventRow,
} from '@client/hooks/queries/useTraces';
import { statusBadge, statusSuccess, statusError } from './observability.css';
import clsx from 'clsx';
import { format } from 'date-fns';
import {
  traceDetailContainer,
  traceDetailHeader,
  traceDetailHeaderLeft,
  traceDetailTitle,
  traceDetailId,
  metricsRow,
  metricItem,
  metricLabel,
  metricValue,
  scrollArea,
  waterfallSection,
  waterfallSectionTitle,
  spanRow,
  spanRowSelected,
  spanNameColumn,
  spanBarColumn,
  spanBar,
  spanBarGeneration,
  spanBarAgent,
  spanBarTool,
  spanBarGuardrail,
  spanBarEmbedding,
  spanBarDefault,
  spanBarError,
  spanDuration,
  spanDetailSection,
  spanDetailHeader,
  spanDetailTitle,
  spanDetailMeta,
  spanDetailMetaItem,
  spanDetailMetaLabel,
  spanDetailMetaValue,
  collapsibleHeader,
  jsonBlock,
  attributeRow,
  attributeKey,
  attributeValue,
  eventsContainer,
  eventItem,
  eventTime,
  eventName,
  emptyDetail,
  loadingContainer,
} from './trace-detail.css';

type SpanNode = SpanRow & { children: SpanNode[]; depth: number };

function buildSpanTree(spans: SpanRow[]): SpanNode[] {
  const spanMap = new Map<string, SpanNode>();
  const roots: SpanNode[] = [];

  for (const span of spans) {
    spanMap.set(span.spanId, { ...span, children: [], depth: 0 });
  }

  for (const node of spanMap.values()) {
    if (node.parentSpanId && spanMap.has(node.parentSpanId)) {
      const parent = spanMap.get(node.parentSpanId)!;
      node.depth = parent.depth + 1;
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  // Sort children by start time
  const sortChildren = (nodes: SpanNode[]) => {
    nodes.sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
    for (const node of nodes) sortChildren(node.children);
  };
  sortChildren(roots);

  return roots;
}

function flattenTree(nodes: SpanNode[]): SpanNode[] {
  const result: SpanNode[] = [];
  const walk = (list: SpanNode[]) => {
    for (const node of list) {
      result.push(node);
      walk(node.children);
    }
  };
  walk(nodes);
  return result;
}

const formatDuration = (ms: number | null) => {
  if (ms === null) return '—';
  if (ms < 1) return '<1ms';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
};

const formatCost = (microDollars: number) => {
  const dollars = microDollars / 1_000_000;
  if (dollars === 0) return '$0.00';
  if (dollars < 0.01) return `$${dollars.toFixed(4)}`;
  return `$${dollars.toFixed(2)}`;
};

const SPAN_STATUS_MAP: Record<number, string> = {
  0: 'unset',
  1: 'ok',
  2: 'error',
};

const SPAN_KIND_MAP: Record<number, string> = {
  0: 'internal',
  1: 'internal',
  2: 'server',
  3: 'client',
  4: 'producer',
  5: 'consumer',
};

type SpanType = 'generation' | 'agent' | 'tool' | 'guardrail' | 'embedding' | 'default';

function getSpanType(span: SpanRow): SpanType {
  const attrs = span.attributes;
  const nameLower = span.name.toLowerCase();

  // LangSmith run_type — direct classification from LangChain tracing
  const runType = attrs['langsmith.run_type'] as string | undefined;
  if (runType) {
    switch (runType) {
      case 'llm':
        return 'generation';
      case 'tool':
      case 'retriever':
        return 'tool';
      case 'embedding':
        return 'embedding';
      case 'chain':
      case 'prompt':
      case 'parser':
        return 'agent';
    }
  }

  // Tool spans
  if (
    attrs['gen_ai.tool.name'] ||
    attrs['ai.toolCall.name'] ||
    nameLower.includes('toolcall') ||
    nameLower.includes('execute_tool')
  ) {
    return 'tool';
  }

  // Guardrail spans
  if (attrs['llmops.guardrail.action'] || nameLower.includes('guardrail')) {
    return 'guardrail';
  }

  // Embedding spans
  if (
    nameLower.includes('embed') ||
    attrs['gen_ai.operation.name'] === 'embeddings'
  ) {
    return 'embedding';
  }

  // LLM generation spans (has model or generation operation)
  if (span.model || attrs['gen_ai.operation.name'] || attrs['ai.operationId']) {
    return 'generation';
  }

  // Agent/orchestration spans (internal kind, no model — typically parent spans)
  if (span.kind <= 1 && !span.model) {
    return 'agent';
  }

  return 'default';
}

const SPAN_TYPE_STYLES: Record<SpanType, string> = {
  generation: spanBarGeneration,
  agent: spanBarAgent,
  tool: spanBarTool,
  guardrail: spanBarGuardrail,
  embedding: spanBarEmbedding,
  default: spanBarDefault,
};

function formatJson(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') {
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  }
  return JSON.stringify(value, null, 2);
}

// --- Sub-components ---

function SpanWaterfallRow({
  span,
  traceStart,
  traceDuration,
  isSelected,
  onClick,
}: {
  span: SpanNode;
  traceStart: number;
  traceDuration: number;
  isSelected: boolean;
  onClick: () => void;
}) {
  const spanStart = new Date(span.startTime).getTime();
  const leftPct =
    traceDuration > 0 ? ((spanStart - traceStart) / traceDuration) * 100 : 0;
  const widthPct =
    traceDuration > 0 && span.durationMs
      ? (span.durationMs / traceDuration) * 100
      : 1;

  const isError = span.status === 2;
  const spanType = getSpanType(span);
  const barStyle = isError ? spanBarError : SPAN_TYPE_STYLES[spanType];

  return (
    <div
      className={clsx(spanRow, isSelected && spanRowSelected)}
      onClick={onClick}
      style={{ paddingLeft: `${span.depth * 16 + 4}px` }}
    >
      <span className={spanNameColumn} style={{ width: `${140 - span.depth * 16}px` }}>
        {span.name}
      </span>
      <div className={spanBarColumn}>
        <div
          className={clsx(spanBar, barStyle)}
          style={{
            left: `${Math.max(0, leftPct)}%`,
            width: `${Math.max(0.5, Math.min(widthPct, 100 - leftPct))}%`,
          }}
        />
      </div>
      <span className={spanDuration}>{formatDuration(span.durationMs)}</span>
    </div>
  );
}

function CollapsibleSection({
  title,
  defaultOpen,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  return (
    <div>
      <button
        type="button"
        className={collapsibleHeader}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <Icon icon={open ? ChevronDown : ChevronRight} size="sm" />
        {title}
      </button>
      {open && children}
    </div>
  );
}

function SpanDetailView({
  span,
  events,
}: {
  span: SpanRow;
  events: SpanEventRow[];
}) {
  const spanStatus = SPAN_STATUS_MAP[span.status] ?? 'unset';
  const spanKind = SPAN_KIND_MAP[span.kind] ?? 'internal';
  const spanEvents = events.filter((e) => e.spanId === span.spanId);

  const filteredAttributes = useMemo(() => {
    return Object.entries(span.attributes).filter(
      ([key]) => !key.startsWith('ai.prompt') && !key.startsWith('ai.response')
    );
  }, [span.attributes]);

  return (
    <div className={spanDetailSection}>
      <div className={spanDetailHeader}>
        <span className={spanDetailTitle}>{span.name}</span>
        <span
          className={clsx(
            statusBadge,
            spanStatus === 'ok'
              ? statusSuccess
              : spanStatus === 'error'
                ? statusError
                : undefined
          )}
        >
          {spanStatus}
        </span>
      </div>

      <div className={spanDetailMeta}>
        <div className={spanDetailMetaItem}>
          <span className={spanDetailMetaLabel}>Kind</span>
          <span className={spanDetailMetaValue}>{spanKind}</span>
        </div>
        <div className={spanDetailMetaItem}>
          <span className={spanDetailMetaLabel}>Duration</span>
          <span className={spanDetailMetaValue}>
            {formatDuration(span.durationMs)}
          </span>
        </div>
        {span.model && (
          <div className={spanDetailMetaItem}>
            <span className={spanDetailMetaLabel}>Model</span>
            <span className={spanDetailMetaValue}>{span.model}</span>
          </div>
        )}
        {span.provider && (
          <div className={spanDetailMetaItem}>
            <span className={spanDetailMetaLabel}>Provider</span>
            <span className={spanDetailMetaValue}>{span.provider}</span>
          </div>
        )}
        {span.totalTokens > 0 && (
          <div className={spanDetailMetaItem}>
            <span className={spanDetailMetaLabel}>Tokens</span>
            <span className={spanDetailMetaValue}>
              {span.promptTokens} / {span.completionTokens}
            </span>
          </div>
        )}
        {span.cost > 0 && (
          <div className={spanDetailMetaItem}>
            <span className={spanDetailMetaLabel}>Cost</span>
            <span className={spanDetailMetaValue}>{formatCost(span.cost)}</span>
          </div>
        )}
        <div className={spanDetailMetaItem}>
          <span className={spanDetailMetaLabel}>Source</span>
          <span className={spanDetailMetaValue}>{span.source}</span>
        </div>
      </div>

      {/* Input */}
      <CollapsibleSection title="Input" defaultOpen>
        {span.input ? (
          <pre className={jsonBlock}>{formatJson(span.input)}</pre>
        ) : (
          <p className={emptyDetail}>No input captured</p>
        )}
      </CollapsibleSection>

      {/* Output */}
      <CollapsibleSection title="Output" defaultOpen>
        {span.output ? (
          <pre className={jsonBlock}>{formatJson(span.output)}</pre>
        ) : (
          <p className={emptyDetail}>No output captured</p>
        )}
      </CollapsibleSection>

      {/* Attributes */}
      {filteredAttributes.length > 0 && (
        <CollapsibleSection title={`Attributes (${filteredAttributes.length})`}>
          <div style={{ margin: '0.25rem 0 0.5rem' }}>
            {filteredAttributes.map(([key, value]) => (
              <div className={attributeRow} key={key}>
                <span className={attributeKey}>{key}</span>
                <span className={attributeValue}>
                  {typeof value === 'object'
                    ? JSON.stringify(value)
                    : String(value)}
                </span>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Span Events */}
      {spanEvents.length > 0 && (
        <CollapsibleSection title={`Events (${spanEvents.length})`}>
          <div className={eventsContainer}>
            {spanEvents.map((evt) => (
              <div className={eventItem} key={evt.id}>
                <span className={eventTime}>
                  {format(new Date(evt.timestamp), 'HH:mm:ss.SSS')}
                </span>
                <span className={eventName}>{evt.name}</span>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Status Message (error details) */}
      {span.statusMessage && (
        <CollapsibleSection title="Error" defaultOpen>
          <pre className={jsonBlock}>{span.statusMessage}</pre>
        </CollapsibleSection>
      )}
    </div>
  );
}

// --- Main Component ---

export function TraceDetail({ traceId }: { traceId: string }) {
  const navigate = useNavigate();
  const { data, isLoading } = useTraceDetail(traceId);
  const [selectedSpanId, setSelectedSpanId] = useState<string | null>(null);

  const handleClose = () => {
    navigate({ to: '/observability/traces' });
  };

  const spanTree = useMemo(
    () => (data?.spans ? buildSpanTree(data.spans) : []),
    [data?.spans]
  );
  const flatSpans = useMemo(() => flattenTree(spanTree), [spanTree]);

  const traceStart = data?.trace
    ? new Date(data.trace.startTime).getTime()
    : 0;
  const traceDuration = data?.trace?.durationMs ?? 0;

  const selectedSpan = useMemo(
    () =>
      selectedSpanId
        ? data?.spans.find((s) => s.spanId === selectedSpanId)
        : null,
    [selectedSpanId, data?.spans]
  );

  if (isLoading) {
    return (
      <div className={loadingContainer}>
        <Loader2 className="animate-spin" size={20} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className={traceDetailContainer}>
        <div className={traceDetailHeader}>
          <span className={traceDetailTitle}>Trace not found</span>
          <Button
            variant="ghost"
            size="icon"
            scheme="gray"
            onClick={handleClose}
          >
            <Icon icon={X} size="sm" />
          </Button>
        </div>
      </div>
    );
  }

  const { trace, events } = data;
  const traceStatus = trace.status;

  return (
    <div className={traceDetailContainer}>
      {/* Header */}
      <div className={traceDetailHeader}>
        <div className={traceDetailHeaderLeft}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h3 className={traceDetailTitle}>
              {trace.name ?? 'Unnamed Trace'}
            </h3>
            <span
              className={clsx(
                statusBadge,
                traceStatus === 'ok'
                  ? statusSuccess
                  : traceStatus === 'error'
                    ? statusError
                    : undefined
              )}
            >
              {traceStatus}
            </span>
          </div>
          <span className={traceDetailId}>{trace.traceId}</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          scheme="gray"
          onClick={handleClose}
        >
          <Icon icon={X} size="sm" />
        </Button>
      </div>

      {/* Metrics */}
      <div className={metricsRow}>
        <div className={metricItem}>
          <span className={metricLabel}>Duration</span>
          <span className={metricValue}>
            {formatDuration(trace.durationMs)}
          </span>
        </div>
        <div className={metricItem}>
          <span className={metricLabel}>Spans</span>
          <span className={metricValue}>{trace.spanCount}</span>
        </div>
        <div className={metricItem}>
          <span className={metricLabel}>Tokens</span>
          <span className={metricValue}>
            {trace.totalInputTokens} / {trace.totalOutputTokens}
          </span>
        </div>
        <div className={metricItem}>
          <span className={metricLabel}>Cost</span>
          <span className={metricValue}>{formatCost(trace.totalCost)}</span>
        </div>
        <div className={metricItem}>
          <span className={metricLabel}>Started</span>
          <span className={metricValue}>
            {format(new Date(trace.startTime), 'HH:mm:ss.SSS')}
          </span>
        </div>
      </div>

      {/* Scrollable area: waterfall + span detail */}
      <div className={scrollArea}>
        {/* Waterfall */}
        <div className={waterfallSection}>
          <div className={waterfallSectionTitle}>Spans</div>
          {flatSpans.map((span) => (
            <SpanWaterfallRow
              key={span.spanId}
              span={span}
              traceStart={traceStart}
              traceDuration={traceDuration}
              isSelected={span.spanId === selectedSpanId}
              onClick={() =>
                setSelectedSpanId(
                  span.spanId === selectedSpanId ? null : span.spanId
                )
              }
            />
          ))}
        </div>

        {/* Selected span detail */}
        {selectedSpan && (
          <SpanDetailView span={selectedSpan} events={events} />
        )}
      </div>
    </div>
  );
}
