import Atom from './Atom'
import createTraps from './traps'

function createAtom<T>(target: T) {
  const atom = new Atom(target)
  const proxy = new Proxy(atom, createTraps())
  atom.proxy = proxy
  return proxy as any
}

function createObservableDescriptor(target: Object, prop: string) {
  // let enhancer = () => {
  //   target[prop] =
  // }
  // return {
  //   value: enhancer,
  //   enumerable: true,
  //   configurable: true,
  //   writable: true
  // }
}

// target: prototype
function createClassPropDecorator(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  /* tslint:disable */
  console.log('arguments: ', arguments)
  console.log(this)
  Object.defineProperty(this, propertyKey, descriptor)
  return descriptor
}

const observableFactories = {
  box<T = any>(value: T) {
    if (typeof value === 'object') {
      throw Error(`do not use \`observable.box\` to make a primitive value to be observable, use observable directly.`)
    }
    return createAtom(value)
  }
}

export function observable<T>(target: T): T
export function observable(target: Object, propertyKey: string, baseDescriptor?: PropertyDescriptor): void
export function observable<T>(arg1: T, arg2?: string, arg3?: PropertyDescriptor): any {
  if (!(typeof arg1 === 'object' || typeof arg1 === 'function')) {
    throw Error('only accept an object')
  }

  if (typeof arg2 === 'string') {
    return createClassPropDecorator(arg1, arg1.constructor.name + '.' + arg2, arg3 as any)
  }

  return createAtom(arg1)
}

Object.keys(observableFactories).forEach(name => (observable[name] = observableFactories[name]))
