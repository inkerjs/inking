import Atom from './Atom'
import { autorun } from './observer'

export default class Computed {
  public computeFn: Function
  public observing: Atom[] = []
  public constructor(initFn: Function) {
    this.computeFn = initFn
    autorun(initFn)
  }
  public get() {
    return this.computeFn()
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
