import protobuf from 'protobufjs';

/**
 * OTLP Protobuf Decoder
 *
 * Decodes binary protobuf ExportTraceServiceRequest into the same JSON
 * structure the OTLP handler already expects. Uses an embedded protobufjs
 * JSON descriptor — no .proto files needed at runtime.
 */

// ---------- proto JSON descriptor (flat, minimal) ----------

const protoDescriptor: protobuf.INamespace = {
  nested: {
    ExportTraceServiceRequest: {
      fields: {
        resourceSpans: {
          rule: 'repeated',
          type: 'ResourceSpans',
          id: 1,
        },
      },
    },
    ResourceSpans: {
      fields: {
        resource: { type: 'Resource', id: 1 },
        scopeSpans: { rule: 'repeated', type: 'ScopeSpans', id: 2 },
        instrumentationLibrarySpans: {
          rule: 'repeated',
          type: 'ScopeSpans',
          id: 1000,
        },
      },
    },
    Resource: {
      fields: {
        attributes: { rule: 'repeated', type: 'KeyValue', id: 1 },
      },
    },
    ScopeSpans: {
      fields: {
        scope: { type: 'InstrumentationScope', id: 1 },
        spans: { rule: 'repeated', type: 'Span', id: 2 },
      },
    },
    InstrumentationScope: {
      fields: {
        name: { type: 'string', id: 1 },
        version: { type: 'string', id: 2 },
      },
    },
    Span: {
      fields: {
        traceId: { type: 'bytes', id: 1 },
        spanId: { type: 'bytes', id: 2 },
        traceState: { type: 'string', id: 3 },
        parentSpanId: { type: 'bytes', id: 4 },
        name: { type: 'string', id: 5 },
        kind: { type: 'SpanKind', id: 6 },
        startTimeUnixNano: { type: 'fixed64', id: 7 },
        endTimeUnixNano: { type: 'fixed64', id: 8 },
        attributes: { rule: 'repeated', type: 'KeyValue', id: 9 },
        events: { rule: 'repeated', type: 'SpanEvent', id: 10 },
        status: { type: 'Status', id: 15 },
      },
    },
    SpanKind: {
      values: {
        SPAN_KIND_UNSPECIFIED: 0,
        SPAN_KIND_INTERNAL: 1,
        SPAN_KIND_SERVER: 2,
        SPAN_KIND_CLIENT: 3,
        SPAN_KIND_PRODUCER: 4,
        SPAN_KIND_CONSUMER: 5,
      },
    },
    SpanEvent: {
      fields: {
        timeUnixNano: { type: 'fixed64', id: 1 },
        name: { type: 'string', id: 2 },
        attributes: { rule: 'repeated', type: 'KeyValue', id: 3 },
      },
    },
    Status: {
      fields: {
        message: { type: 'string', id: 2 },
        code: { type: 'StatusCode', id: 3 },
      },
    },
    StatusCode: {
      values: {
        STATUS_CODE_UNSET: 0,
        STATUS_CODE_OK: 1,
        STATUS_CODE_ERROR: 2,
      },
    },
    KeyValue: {
      fields: {
        key: { type: 'string', id: 1 },
        value: { type: 'AnyValue', id: 2 },
      },
    },
    AnyValue: {
      fields: {
        stringValue: { type: 'string', id: 1 },
        boolValue: { type: 'bool', id: 2 },
        intValue: { type: 'int64', id: 3 },
        doubleValue: { type: 'double', id: 4 },
        arrayValue: { type: 'ArrayValue', id: 5 },
        kvlistValue: { type: 'KeyValueList', id: 6 },
        bytesValue: { type: 'bytes', id: 7 },
      },
      oneofs: {
        value: {
          oneof: [
            'stringValue',
            'boolValue',
            'intValue',
            'doubleValue',
            'arrayValue',
            'kvlistValue',
            'bytesValue',
          ],
        },
      },
    },
    ArrayValue: {
      fields: {
        values: { rule: 'repeated', type: 'AnyValue', id: 1 },
      },
    },
    KeyValueList: {
      fields: {
        values: { rule: 'repeated', type: 'KeyValue', id: 1 },
      },
    },
  },
};

// ---------- singleton root + message type ----------

let _root: protobuf.Root | null = null;
let _RequestType: protobuf.Type | null = null;

function getRequestType(): protobuf.Type {
  if (!_RequestType) {
    _root = protobuf.Root.fromJSON(protoDescriptor);
    _RequestType = _root.lookupType('ExportTraceServiceRequest');
  }
  return _RequestType;
}

// ---------- helpers ----------

function bytesToHex(bytes: Uint8Array | Buffer | number[]): string {
  return Buffer.from(bytes).toString('hex');
}

function isZeroBytes(bytes: Uint8Array | Buffer | number[]): boolean {
  for (let i = 0; i < bytes.length; i++) {
    if (bytes[i] !== 0) return false;
  }
  return true;
}

/**
 * Convert a protobufjs Long / number / string to a nanosecond string.
 * protobufjs decodes fixed64 as Long when longs are not forced to number.
 */
function toNanoString(
  val: unknown
): string {
  if (val == null) return '0';
  // protobufjs Long
  if (typeof val === 'object' && val !== null && 'toString' in val) {
    return val.toString();
  }
  return String(val);
}

/**
 * Normalise an AnyValue from decoded protobuf into the OTLP JSON shape.
 */
function normaliseAnyValue(
  av: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (av.stringValue !== undefined && av.stringValue !== '')
    out.stringValue = av.stringValue;
  if (av.boolValue !== undefined && av.boolValue !== false)
    out.boolValue = av.boolValue;
  if (av.intValue !== undefined) {
    // Long → string | number
    const v = av.intValue;
    out.intValue =
      typeof v === 'object' && v !== null && 'toNumber' in v
        ? (v as { toNumber: () => number }).toNumber()
        : Number(v);
  }
  if (av.doubleValue !== undefined && av.doubleValue !== 0)
    out.doubleValue = av.doubleValue;
  if (av.arrayValue !== undefined && av.arrayValue !== null) {
    const arr = av.arrayValue as { values?: unknown[] };
    out.arrayValue = {
      values: (arr.values ?? []).map((v) =>
        normaliseAnyValue(v as Record<string, unknown>)
      ),
    };
  }
  if (av.kvlistValue !== undefined && av.kvlistValue !== null) {
    const kvl = av.kvlistValue as { values?: unknown[] };
    out.kvlistValue = {
      values: (kvl.values ?? []).map((kv) =>
        normaliseKeyValue(kv as Record<string, unknown>)
      ),
    };
  }
  if (av.bytesValue !== undefined) {
    out.bytesValue = bytesToHex(av.bytesValue as Uint8Array);
  }
  return out;
}

function normaliseKeyValue(
  kv: Record<string, unknown>
): { key: string; value: Record<string, unknown> } {
  return {
    key: kv.key as string,
    value: normaliseAnyValue(
      (kv.value as Record<string, unknown>) ?? {}
    ),
  };
}

// ---------- public API ----------

/**
 * JSON-shaped types the OTLP handler already consumes
 * (re-declared locally to avoid circular imports).
 */
export interface OtlpKeyValue {
  key: string;
  value: {
    stringValue?: string;
    intValue?: string | number;
    doubleValue?: number;
    boolValue?: boolean;
    arrayValue?: { values: Array<{ stringValue?: string }> };
  };
}

export interface OtlpEvent {
  name: string;
  timeUnixNano: string;
  attributes?: OtlpKeyValue[];
}

export interface OtlpSpan {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  kind?: number;
  startTimeUnixNano: string;
  endTimeUnixNano?: string;
  attributes?: OtlpKeyValue[];
  events?: OtlpEvent[];
  status?: { code?: number; message?: string };
}

export interface OtlpScopeSpans {
  scope?: { name?: string; version?: string };
  spans: OtlpSpan[];
}

export interface OtlpResourceSpans {
  resource?: { attributes?: OtlpKeyValue[] };
  scopeSpans: OtlpScopeSpans[];
}

export interface ExportTraceServiceRequest {
  resourceSpans: OtlpResourceSpans[];
}

/**
 * Decode an OTLP protobuf-encoded ExportTraceServiceRequest binary into
 * the same JSON structure the handler expects.
 *
 * - bytes fields (trace_id, span_id, parent_span_id) → hex strings
 * - fixed64 nano timestamps → string (for nanoToDate())
 * - Long intValue → number
 * - deprecated instrumentationLibrarySpans merged into scopeSpans
 */
export function decodeOtlpProtobuf(
  buffer: Uint8Array
): ExportTraceServiceRequest {
  const RequestType = getRequestType();
  const decoded = RequestType.decode(buffer) as unknown as Record<
    string,
    unknown
  >;

  const rawResourceSpans = (decoded.resourceSpans ?? []) as Array<
    Record<string, unknown>
  >;

  const resourceSpans: OtlpResourceSpans[] = rawResourceSpans.map((rs) => {
    // Resource attributes
    const rawResource = rs.resource as
      | { attributes?: Array<Record<string, unknown>> }
      | undefined;
    const resource = rawResource
      ? {
          attributes: (rawResource.attributes ?? []).map(
            normaliseKeyValue
          ) as OtlpKeyValue[],
        }
      : undefined;

    // Merge scopeSpans + deprecated instrumentationLibrarySpans
    const rawScopeSpans = [
      ...((rs.scopeSpans ?? []) as Array<Record<string, unknown>>),
      ...((rs.instrumentationLibrarySpans ?? []) as Array<
        Record<string, unknown>
      >),
    ];

    const scopeSpans: OtlpScopeSpans[] = rawScopeSpans.map((ss) => {
      const rawScope = ss.scope as
        | { name?: string; version?: string }
        | undefined;

      const rawSpans = (ss.spans ?? []) as Array<Record<string, unknown>>;

      const spans: OtlpSpan[] = rawSpans.map((s) => {
        const traceIdBytes = s.traceId as Uint8Array | undefined;
        const spanIdBytes = s.spanId as Uint8Array | undefined;
        const parentSpanIdBytes = s.parentSpanId as Uint8Array | undefined;

        const traceId = traceIdBytes ? bytesToHex(traceIdBytes) : '';
        const spanId = spanIdBytes ? bytesToHex(spanIdBytes) : '';
        const parentSpanId =
          parentSpanIdBytes &&
          parentSpanIdBytes.length > 0 &&
          !isZeroBytes(parentSpanIdBytes)
            ? bytesToHex(parentSpanIdBytes)
            : undefined;

        const rawAttrs = (s.attributes ?? []) as Array<
          Record<string, unknown>
        >;
        const attributes = rawAttrs.map(normaliseKeyValue) as OtlpKeyValue[];

        const rawEvents = (s.events ?? []) as Array<Record<string, unknown>>;
        const events: OtlpEvent[] = rawEvents.map((e) => ({
          name: (e.name as string) ?? '',
          timeUnixNano: toNanoString(e.timeUnixNano),
          attributes: ((e.attributes ?? []) as Array<Record<string, unknown>>).map(
            normaliseKeyValue
          ) as OtlpKeyValue[],
        }));

        const rawStatus = s.status as
          | { code?: number; message?: string }
          | undefined;

        return {
          traceId,
          spanId,
          parentSpanId,
          name: (s.name as string) ?? '',
          kind: s.kind as number | undefined,
          startTimeUnixNano: toNanoString(s.startTimeUnixNano),
          endTimeUnixNano: s.endTimeUnixNano
            ? toNanoString(s.endTimeUnixNano)
            : undefined,
          attributes,
          events: events.length > 0 ? events : undefined,
          status: rawStatus
            ? { code: rawStatus.code, message: rawStatus.message }
            : undefined,
        };
      });

      return {
        scope: rawScope
          ? { name: rawScope.name, version: rawScope.version }
          : undefined,
        spans,
      };
    });

    return { resource, scopeSpans };
  });

  return { resourceSpans };
}
