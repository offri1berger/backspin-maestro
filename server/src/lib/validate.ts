type SafeParseResult<T> = { success: true; data: T } | { success: false }

interface SchemaLike<T> {
  safeParse(input: unknown): SafeParseResult<T>
}

export const parsePayload = <T>(
  schema: SchemaLike<T>,
  payload: unknown,
): T | null => {
  const result = schema.safeParse(payload)
  return result.success ? result.data : null
}
