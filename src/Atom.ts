import { $IS_ATOM, primitiveType } from './types'

class Atom {
  public proxy!: any
  public source!: object
  public proxiedProps: (string | number | symbol)[] = []
  public reactions: Function[] = []

  public constructor(value: any) {
    this.source = value
  }

  public isEqual: (oldValue: primitiveType, newValue: primitiveType) => boolean = (oldValue, newValue) => {
    // TODO: import a default primitive value equal function
    return oldValue === newValue
  }

  public get(prop) {
    if (prop === $IS_ATOM) {
      return true
    }

    // return the real value
    return this.source[prop]
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

  public addReaction = (fn: Function) => {
    this.reactions.push(fn)
  }

  public reportChanged = () => {
    this.reactions.forEach(reaction => {
      reaction()
    })
  }
}

export default Atom
