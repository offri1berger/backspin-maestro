export const safeJsonParse = <T>(raw: string, context: string): T | null => {
  try {
    return JSON.parse(raw) as T
  } catch (err) {
    console.error('safeJsonParse failed', { context, err })
    return null
  }
}
