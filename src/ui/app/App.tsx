/**
 * Phase 0 shell. Deliberately empty of features: it exists so the toolchain,
 * theming and routing seams are real and testable before Phase 1 fills them.
 * The module list comes from SPEC §7; routes are added module by module.
 */
export function App() {
  return (
    <main className="shell">
      <h1 className="shell__title">Liraasa Workbench</h1>
      <p className="shell__lede">
        Phase 0 scaffold. The core engine, lexicon, translator and learning modules are not built
        yet — see <code>docs/SPEC.md</code> §13 for the phase plan.
      </p>
    </main>
  );
}
