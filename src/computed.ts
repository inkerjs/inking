import Atom from './Atom'
import { autorun } from './observer'
import createTraps from './traps'

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
}

export const createComputed = (initFn: Function) => {
  const computed = new Computed(initFn)
  return computed
  // const atom = new Atom(target)
  // const proxy = new Proxy(atom, createTraps())
  // atom.proxy = proxy
  // return proxy as any
}
