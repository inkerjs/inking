import Atom, { getAtomFromProxy } from './Atom'
import createTraps from './traps'

// TODO: change name, createAtom indeed return a proxy, not an atom
function createAtom<T>(target: T) {
  const atom = new Atom(target)
  const proxy = new Proxy(atom, createTraps())
  atom.proxy = proxy
  return proxy as any
}

// @observable('a', 'b', 'c')
// Class Model {...}
function createClassObservableDecorator(props: IDecoratorPropsRestArgs) {
  let pickedProps: string[] = []
  if (Array.isArray(props[0])) {
    pickedProps = props[0] as string[]
  } else {
    pickedProps = props as string[]
  }

  return function decorateClassObservable(TargetClass: any) {
    function wrap(...args: any[]) {
      const proxy = createAtom(new TargetClass(...args))
      const atom = getAtomFromProxy(proxy) as Atom
      atom.pickedProps = pickedProps
      return proxy
    }
    return wrap as any
  }
}

// @observable
// Class Model {...}
function decorateClassObservable(TargetClass: any) {
  function wrap(...args: any[]) {
    return createAtom(new TargetClass(...args))
  }
  return wrap as any
}

export interface IObservableFactories {
  box<T = any>(value: T): T
}

const observableFactories: IObservableFactories = {
  box<T = any>(value: T) {
    if (typeof value === 'object') {
      throw Error(`do not use \`observable.box\` to make a primitive value to be observable, use observable directly.`)
    }
    return createAtom(value)
  }
}

// @observable('a', 'b', 'c')
// @observable(['a', 'b', 'c'])
export type IDecoratorPropsRestArgs = string[] | string[][] | void[]

export function observable<T>(target: T): T
export function observable(...props: IDecoratorPropsRestArgs): ClassDecorator
export function observable(...props: IDecoratorPropsRestArgs): any {
  const [arg1, ...otherArgs] = props

  // observable(model)
  if (typeof arg1 === 'object' && props.length === 1) {
    return createAtom(arg1) as any
  }

  // @observable
  // Class Model {...}
  if (typeof arg1 === 'function' && props.length === 1) {
    return decorateClassObservable(arg1)
  }

  // @observable('a', 'b', 'c')
  // Class Model {...}
  if (props.length > 1) {
    return createClassObservableDecorator(props)
  }

  throw Error('only accept an plain object or a Class')
}

Object.keys(observableFactories).forEach(name => (observable[name] = observableFactories[name]))
