import { logger } from './logger.js'

export const safeJsonParse = <T>(raw: string, context: string): T | null => {
  try {
    return JSON.parse(raw) as T
  } catch (err) {
    logger.error({ err, context }, 'safeJsonParse failed')
    return null
  }
}
