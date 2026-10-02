/** Electron prefixes errors thrown in the main process ("Error invoking remote method 'x': Error: ..."). */
export function ipcErrorMessage(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err)
  return message.replace(/^Error invoking remote method '[^']*': (Error: )?/, '')
}
