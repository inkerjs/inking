import { endBatch, startBatch } from './observer'

export function runInAction(fn: () => any | Promise<any>, debugName?: string) {
  startBatch()
  try {
    return fn()
  } finally {
    endBatch()
  }
}

export function action(fn: () => any): void {
  return runInAction.call(null, fn)
}
