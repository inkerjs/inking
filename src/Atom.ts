import { globalState } from './globalState'
import { IChange } from './intercept'
import { SideEffect } from './observer'
import { invariant, defaultComparer } from './utils'

type Interceptor = (change: IChange) => IChange | null
type IAtomType = 'primitive' | 'object'
function defaultInterceptor(change: IChange) {
  return change
}

export default class Atom {
  public type!: IAtomType
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

  public addReaction = (reaction: SideEffect | undefined | null, extraCondition = true) => {
    if (reaction instanceof SideEffect && this.sideEffects.indexOf(reaction) < 0 && extraCondition) {
      this.sideEffects.push(reaction)
    }
  }

  public inheritSideEffects = (oldAtom: Atom) => {
    this.sideEffects = oldAtom.sideEffects
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

  public shouldShallowUpdate = (oldValue: any, newValue: any) => !defaultComparer(oldValue, newValue)

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
