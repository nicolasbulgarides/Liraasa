/** Shared stub for Phase 0 CLI entry points. */
export function notImplemented(command: string, phase: string): never {
  console.error(`npm run ${command} is scaffolded but not implemented yet (arrives in ${phase}).`);
  console.error('See docs/SPEC.md §13 for the phase plan.');
  process.exit(2);
}
