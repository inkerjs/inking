import Atom from './Atom'
import createTraps from './traps'

function createAtom<T>(target: T) {
  const atom = new Atom(target)
  const proxy = new Proxy(atom, createTraps())
  atom.proxy = proxy
  return proxy as any
}

// target: Class
function createClassObservableDecorator(TargetClass: any) {
  function wrap(...args: any[]) {
    // const instance = new TargetClass(...args)
    return createAtom(new TargetClass(...args))
  }
  return wrap as any
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
  // observable(model)
  if (typeof target === 'object') {
    return createAtom(target) as T
  }

  // @observable
  // Class Model {...}
  if (typeof target === 'function') {
    return createClassObservableDecorator(target) as T
  }

  throw Error('only accept an plain object or a Class')
}

Object.keys(observableFactories).forEach(name => (observable[name] = observableFactories[name]))
