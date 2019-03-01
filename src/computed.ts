import { action, runInAction } from './action'
import Atom from './Atom'
import { autorun, getCurrCollectingEffect, resetCurrCollectingEffect, SideEffect } from './observer'

export default class Computed {
  public value: any
  public computeFn: Function
  public observing: Atom[] = []
  public sideEffects: SideEffect[] = []
  public constructor(initFn: Function) {
    this.computeFn = initFn
    const boundRecompute = this.reCompute.bind(this)
    // const inActionRecompute = () => runInAction(boundRecompute)
    // const reComputeAction = action(this.reCompute.bind(this))
    autorun(boundRecompute, 'computed')
  }

  public reCompute() {
    this.value = this.computeFn()
    this.sideEffects.forEach(sideEffect => {
      sideEffect.runEffect()
    })
  }

  public get() {
    this.addReaction(getCurrCollectingEffect())
    return this.value
  }

  public addReaction = (handler: SideEffect | null) => {
    if (handler === null) return
    if (!Array.isArray(this.sideEffects)) {
      this.sideEffects = []
    }
    this.sideEffects.push(handler)
  }

  public set() {
    throw Error(`do not try to set a computed value, it's automatic computed.`)
  }
}

export const createComputed = (initFn: Function) => {
  const computed = new Computed(initFn)
  return computed
  // const atom = new Atom(target)
  // const proxy = new Proxy(atom, createTraps())
  // atom.proxy = proxy
  // return proxy as any
}
