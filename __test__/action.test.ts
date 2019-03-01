import { action, autorun, observable } from '../src/index'
import { buffer, getPlainObj } from './utils'

test('modify same property in transaction', () => {
  const obj = observable(getPlainObj())
  const b = buffer()

  autorun(() => {
    b(obj.name)
  })

  action(() => {
    obj.name = 't1'
    obj.name = 't2'
    obj.name = 't3'
  })

  expect(b.toArray()).toEqual(['Adam', 't3'])
})

test('modify with native method', () => {
  const obj = observable(getPlainObj())
  const b1 = buffer()
  const b2 = buffer()
  const b3 = buffer()

  autorun(() => {
    b1(obj.skills.length)
  })

  autorun(() => {
    b2(obj.skills[1])
  })

  autorun(() => {
    b3(obj.skills.join('_'))
  })

  action(() => {
    obj.skills.unshift('i1')
    obj.skills.unshift('i2')
    obj.skills.pop()
    obj.skills.splice(0, 2, 'i3')
    obj.skills.shift()
  })

  expect(b1.toArray()).toEqual([2, 1])
  expect(b2.toArray()).toEqual(['sleep', undefined])
  expect(b3.toArray()).toEqual(['eat_sleep', 'eat'])
})
