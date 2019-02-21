import { $IS_ATOM, primitiveType } from './types'

export type AtomType = `object` | `array` // TODO: Set, Map, WeakMap, primitive value

// TODO: add generic <T> ?
class Atom {
  public proxy!: any // TODO: type for a Proxy value is hard since proxy is transparent?
  public source!: object
  public isBeingTracked = false
  public proxiedProps: (string | number | symbol)[] = []
  public reactions: Function[] = []
  public atomType!: AtomType

  public constructor(value: any) {
    switch (true) {
      case Array.isArray(value):
        this.atomType = `array`
        break
      default:
        this.atomType = `object`
        break
    }
    this.source = value
  }

  public isEqual: (oldValue: primitiveType, newValue: primitiveType) => boolean = (oldValue, newValue) => {
    // TODO: import a default primitive value equal function
    return oldValue === newValue
  }

  public get(prop) {
    const value = this.source[prop]
    // native function will be called directly
    if (typeof value === 'function') {
      // TODO: ...args
      return value
    }
    return value
  }

  public set(prop, newValue) {
    const oldValue = this.source[prop]
    this.source[prop] = newValue
    if (!this.isEqual(oldValue, newValue)) {
      this.reportChanged()
    } else {
      // TODO: if not changed
    }
  }

  public addProxiedProp = (prop: string | number | symbol, atom: Atom) => {
    this.proxiedProps[prop] = atom
  }

  public isPropProxied = (prop: string | number | symbol) => {
    return Object.keys(this.proxiedProps).indexOf(prop.toString()) >= 0
  }

  public addReaction = (fn: Function | Function[]) => {
    if (fn === null) return

    if (this.proxiedProps.length === 0) {
      this.isBeingTracked = true
    }

    if (Array.isArray(fn)) {
      this.reactions.push(...fn)
    } else {
      this.reactions.push(fn)
    }
  }

  public removeReaction = (fn: Function) => {
    this.reactions.push(fn)
  }

  public reportChanged = () => {
    this.reactions.forEach(reaction => {
      reaction()
    })
  }
}

export default Atom
