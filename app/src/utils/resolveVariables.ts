const VARIABLE_PATTERN = /\{\{([^{}\s]+)\}\}/g;

export function resolveVariables(input: string, variables: Record<string, string>): string {
  if (!input || !VARIABLE_PATTERN.test(input)) {
    VARIABLE_PATTERN.lastIndex = 0;
    return input;
  }

  const resolved = input.replace(VARIABLE_PATTERN, (_, key) => {
    const value = variables[key];
    return value ?? "";
  });

  VARIABLE_PATTERN.lastIndex = 0;
  return resolved;
}

export function resolveVariablesRecursive(
  input: string,
  variables: Record<string, string>,
  depth = 0,
): string {
  if (depth >= 5) {
    return input;
  }

  const resolved = resolveVariables(input, variables);
  if (!resolved.includes("{{")) {
    return resolved;
  }

  return resolveVariablesRecursive(resolved, variables, depth + 1);
}

export function collectMissingVariables(
  input: string,
  variables: Record<string, string>,
): string[] {
  if (!input) {
    return [];
  }

  const missing = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = VARIABLE_PATTERN.exec(input)) !== null) {
    const key = match[1];
    if (variables[key] === undefined) {
      missing.add(key);
    }
  }
  VARIABLE_PATTERN.lastIndex = 0;
  return Array.from(missing);
}
