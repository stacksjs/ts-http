import { Logger } from '@stacksjs/clarity'
import { config } from './config'

const logger = new Logger('httx', {
  showTags: false,
})

function shouldLog(category: string, verbose?: boolean | string[]): boolean {
  // When verbose is explicitly provided, use it and don't fall back to config
  if (verbose !== undefined) {
    if (verbose === false) {
      return false
    }

    if (verbose === true) {
      return true
    }

    // verbose is an array - check if category matches any prefix
    if (Array.isArray(verbose)) {
      return verbose.some(prefix => category.startsWith(prefix))
    }
  }

  // Fall back to config.verbose when no explicit verbose parameter
  if (config.verbose === true) {
    return true
  }

  if (Array.isArray(config.verbose)) {
    return config.verbose.some(prefix => category.startsWith(prefix))
  }

  return false
}

export function debugLog(category: string, message: string | (() => string), verbose?: boolean | string[]): void {
  if (!shouldLog(category, verbose)) {
    return
  }

  // Lazy evaluation: only compute message if logging will occur
  const actualMessage = typeof message === 'function' ? message() : message
  logger.debug(`[httx:${category}] ${actualMessage}`)
}

export async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
