import { Action, autorun, observable } from '../src/index'
import { buffer, getPlainObj } from './utils'

test('transaction', () => {
  const obj = observable(getPlainObj())
  const b = buffer()

  autorun(() => {
    b(obj.name)
  })

  Action(() => {
    obj.name = 't1'
    obj.name = 't2'
    obj.name = 't3'
  })

  expect(b.toArray()).toEqual(['Adam', 't3'])
})
