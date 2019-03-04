import Atom from './Atom'
import createTraps from './traps'

function createAtom<T>(target: T) {
  const atom = new Atom(target)
  const proxy = new Proxy(atom, createTraps())
  atom.proxy = proxy
  return proxy as any
}

const observableFactories = {
  box<T = any>(value: T) {
    if (typeof value === 'object') {
      throw Error(`do not use \`observable.box\` to make a primitive value to be observable, use observable directly.`)
    }
    return createAtom(value)
  }
}

export function observable<T>(target: T): T {
  if (typeof target !== 'object') {
    throw Error('only accept an object')
  }

  return createAtom(target)
}

Object.keys(observableFactories).forEach(name => (observable[name] = observableFactories[name]))
