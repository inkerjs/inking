import Atom, { getAtomOfProxy } from './Atom'
import createTraps from './traps'
import { IDecoratorPropsRestArgs } from './types'

function createProxyOfAtom<T>(target: T): T {
  const atom = new Atom<T>(target)
  const proxy = new Proxy(atom, createTraps())
  atom.proxy = (proxy as any) as T
  return (proxy as any) as T
}

// @observable('a', 'b', 'c')
// Class Model {...}
function createClassObservableDecorator(props: IDecoratorPropsRestArgs) {
  let pickedProps: string[] = props as string[]

  return function decorateClassObservable<T>(TargetClass: T) {
    function wrap(...args: any[]) {
      const proxy = createProxyOfAtom(new (TargetClass as any)(...args))
      const atom = getAtomOfProxy(proxy) as Atom<T>
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
    return createProxyOfAtom(new TargetClass(...args))
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
    return createProxyOfAtom(value)
  }
}

export function observable<T>(target: T): T
export function observable(...props: IDecoratorPropsRestArgs): ClassDecorator
export function observable(...props: IDecoratorPropsRestArgs): any {
  const [arg1, ...otherArgs] = props

  // observable(model)
  if (typeof arg1 === 'object' && props.length === 1) {
    return createProxyOfAtom(arg1) as any
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
