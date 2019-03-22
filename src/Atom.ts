import { globalState } from './globalState'
import { createHandler } from './handlers'
import { IChange } from './intercept'
import { SideEffect } from './observer'
import { defaultComparer, invariant, Lambda } from './utils'

type Interceptor = (change: IChange) => IChange | null
function defaultInterceptor(change: IChange) {
  return change
}

export default class Atom {
  public interceptor: Interceptor = defaultInterceptor
  public path: string
  public target: any
  public proxy: Object | null
  public sideEffects: SideEffect[] = []
  public constructor(path: string, target: any, proxy) {
    this.path = path
    this.target = target
    this.proxy = proxy
  }

  public addReaction = (reaction: SideEffect | undefined | null) => {
    if (reaction instanceof SideEffect && this.sideEffects.indexOf(reaction) < 0) {
      this.sideEffects.push(reaction)
    }
  }

  public inheritSideEffects = (oldSideEffects: SideEffect[]) => {
    this.sideEffects = oldSideEffects
  }

  public registerInterceptor = (interceptor: Interceptor) => {
    this.interceptor = interceptor
  }

  public resetInterceptor = () => {
    this.interceptor = defaultInterceptor
  }

  public isIntercepted = (oldValue: any, newValue: any): boolean => {
    const interceptRes = this.interceptor({ oldValue, newValue })
    return interceptRes === null ? true : false
  }

  public reportChanged = (oldValue: any, newValue: any) => {
    const interceptRes = this.interceptor({ oldValue, newValue })
    if (interceptRes === null) return

    this.sideEffects.forEach(sideEffect => {
      switch (sideEffect.type) {
        case 'computed':
          // computed should be directly "unzipped" to release the reactions
          sideEffect.runEffectWithPredict()
          break
        case 'reaction':
          globalState.simpleThunk.add(sideEffect)
          break
        default:
          invariant('type of side effect should be specified.')
      }
    })
  }
}
