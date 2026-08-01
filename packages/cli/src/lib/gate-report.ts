import type { GateCheck, GateResult } from '@llmops/sdk/eval';

const RESET = '\x1b[0m';
const DIM = '\x1b[2m';
const BOLD = '\x1b[1m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';

/**
 * One-line human description of a single gate check, used by printGateReport.
 * Falls back to the check's own `message` (set for checks that failed closed,
 * e.g. an unmatched evaluator) before rendering the type-specific numbers.
 */
export function describeCheck(check: GateCheck): string {
  if (check.message) return check.message;

  if (check.type === 'min-score') {
    return `score=${check.score?.toFixed(2)} min=${check.threshold}`;
  }

  const sign = (check.delta ?? 0) >= 0 ? '+' : '';
  return `${check.baseline?.toFixed(2)} → ${check.candidate?.toFixed(2)} (delta ${sign}${check.delta?.toFixed(2)}, max regression ${check.maxRegression})`;
}

/**
 * Renders a GateResult to stdout for the CLI's non-JSON mode. Pure
 * presentation over an already-computed gate — see applyGate() in
 * @llmops/sdk/eval for how checks are produced.
 */
export function printGateReport(gate: GateResult): void {
  console.log(`\n${BOLD}Gate${RESET}  ${DIM}${'─'.repeat(40)}${RESET}`);

  if (gate.checks.length === 0) {
    console.log(`  ${RED}✗${RESET} ${DIM}no checks ran${RESET}`);
  }

  for (const check of gate.checks) {
    const icon = check.passed ? `${GREEN}✓${RESET}` : `${RED}✗${RESET}`;
    const label = check.evaluator
      ? `${check.eval} ${DIM}›${RESET} ${check.evaluator}`
      : check.eval;
    console.log(`  ${icon} ${label}  ${DIM}${describeCheck(check)}${RESET}`);
  }

  console.log(
    gate.passed
      ? `${GREEN}Gate passed${RESET}`
      : `${RED}Gate failed${RESET} — ${gate.checks.filter((c) => !c.passed).length} of ${gate.checks.length} check(s) did not pass`,
  );
}
