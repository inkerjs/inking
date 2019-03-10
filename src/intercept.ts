import Atom, { getAtomOfProxy, IChange } from './Atom'
import { Lambda } from './utils'

type IInterceptor = (IChange) => IChange | null

function interceptProperty(thing, prop, handler) {
  const atom = getAtomOfProxy(thing)
  if (!(atom instanceof Atom)) {
    throw new Error('thing[prop] should be a atom')
  }

  atom.interceptors[prop] = handler
  return () => {
    delete atom.interceptors[prop]
  }
}

// TODO: accept a `observable.box()` value
function interceptAtom(thing, handler) {}

export function intercept(obj: any, handler: IInterceptor): any
export function intercept(obj: any, property: string, handler: IInterceptor): Lambda

export function intercept(thing: any, propOrHandler, handler?): any {
  if (typeof handler === 'function') return interceptProperty(thing, propOrHandler, handler)
  return interceptAtom(thing, propOrHandler)
}
