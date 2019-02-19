import Atom from './Atom'
import { autorun } from './observer'
import createTraps from './traps'
// import { $FROX, $TAGS } from './types'

function observable<T>(target: T): T {
  if (typeof target !== 'object') {
    throw Error('only accept an object')
  }

  const atom = new Atom(target)
  const proxy = new Proxy(atom, createTraps())
  atom.proxy = proxy
  // root proxy element
  // proxy.parent = null
  // proxy.prop = null

  // proxy[$FROX] = true
  // return atom.proxy as any
  return proxy
}

export { autorun }
export default observable
