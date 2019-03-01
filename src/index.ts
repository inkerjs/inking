import { action } from './action'
import Atom from './Atom'
import Computed, { createComputed } from './computed'
import { autorun } from './observer'
import { reaction } from './reaction'
import createTraps from './traps'
import { when } from './when'

function createAtom<T>(target: T) {
  const atom = new Atom(target)
  const proxy = new Proxy(atom, createTraps())
  atom.proxy = proxy
  return proxy as any
}

function observable<T>(target: T): T {
  if (typeof target !== 'object') {
    throw Error('only accept an object')
  }

  return createAtom(target)
}

const observableFactories = {
  box<T = any>(value: T) {
    if (typeof value === 'object') {
      throw Error(`do not use \`observable.box\` to make a primitive value to be observable, use observable directly.`)
    }
    return createAtom(value)
  }
}

Object.keys(observableFactories).forEach(name => (observable[name] = observableFactories[name]))

export { action, autorun, Computed, createComputed, observable, reaction, when }
