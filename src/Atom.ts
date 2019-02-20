import { $TINAR } from './types'

class Atom {
  public proxy!: any
  public source!: any
  public atomSource: any = {}
  public proxiedProps: any[] = []
  public reactions: Function[] = []

  public constructor(value: any) {
    this.source = value
  }

  public get(prop) {
    if (prop === $TINAR) {
      return true
    }

    return this.source[prop]
  }

  public set(prop, newValue) {
    const oldValue = this.source[prop]
    this.source[prop] = newValue
    if (oldValue !== newValue) {
      this.reportChanged()
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
