import Atom from './Atom'
import createTraps from './traps'

function createAtom<T>(target: T) {
  const atom = new Atom(target)
  const proxy = new Proxy(atom, createTraps())
  atom.proxy = proxy
  return proxy as any
}

function createClassPropDecorator(target: any, propertyKey: string, descriptor?: PropertyDescriptor) {
  // TODO: decorator a prop will not have base descriptor ???
  if (descriptor) {
    return descriptor
  }

  console.log(target)
  return {
    value: createAtom(target[propertyKey]),
    enumerable: false,
    configurable: true,
    writable: true
  }

  // }
  // get() {
  // },
  // set() {
  //   return createAtom(target[propertyKey])
  // }
}

// function observable<T>(target: T = {} as any): T {
//   if (typeof target === "function") { // 挂在 class 的 decorator
//     return createObservableObjectDecorator(target)
//   } else {
//     return createObservableObject(target as any) as T
//   }
// }

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

  if (typeof arg1 === 'object' && typeof arg2 === 'string') {
    return createClassPropDecorator(arg1, arg1.constructor.name + '.' + arg2, arg3 as any) as any
  }

  return createAtom(arg1)
}

Object.keys(observableFactories).forEach(name => (observable[name] = observableFactories[name]))
