import { autorun, observable } from '../src'
import { buffer, getPlainObj } from './utils'

test('basic box value', () => {
  const b = buffer()
  const bVal = (observable as any).box(0)
  autorun(() => {
    b(bVal.get())
  })

  const s = Symbol('')
  bVal.set(1)
  bVal.set(1)
  bVal.set(2)
  bVal.set('hello')
  bVal.set(false)
  bVal.set(undefined)
  bVal.set(s)

  expect(b.toArray()).toEqual([0, 1, 2, 'hello', false, undefined, s])
})
