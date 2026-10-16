/**
 * Minimal argv parsing shared by the CLIs.
 *
 * Flags take a value (`--edition 1.1-draft`), so a flag's value must not be
 * mistaken for a positional argument.
 */

export interface Args {
  positional: string[];
  flags: Record<string, string>;
  booleans: Set<string>;
}

/**
 * @param valueFlags flags that consume the next argv entry as their value.
 */
export function parseArgs(argv: readonly string[], valueFlags: readonly string[]): Args {
  const positional: string[] = [];
  const flags: Record<string, string> = {};
  const booleans = new Set<string>();

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === undefined) continue;

    if (!arg.startsWith('--')) {
      positional.push(arg);
      continue;
    }

    const name = arg.slice(2);
    if (valueFlags.includes(name)) {
      const value = argv[i + 1];
      if (value === undefined) throw new Error(`--${name} needs a value`);
      flags[name] = value;
      i += 1;
    } else {
      booleans.add(name);
    }
  }

  return { positional, flags, booleans };
}
