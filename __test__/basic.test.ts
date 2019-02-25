import { autorun, observable } from '../src/index'
import { buffer, getPlainObj } from './utils'

test('observer of array', () => {
  const obj = observable(getPlainObj())
  const b = buffer()
  autorun(() => {
    b(obj.name)
  })
  obj.name = 'Adam'
  obj.name = 'David'
  obj.name = 'David'
  expect(b.toArray()).toEqual(['Adam', 'David'])
})

test('key/value access right', () => {
  const o = observable(getPlainObj())
  expect(o.name).toBe('Adam')
  expect(o.family.father.name).toBe('daddy')
  expect(o.pets[0].name).toBe('Cathy')
  expect(o.pets.length).toBe(1)
  expect(o.skills[0]).toBe('eat')
  expect(o.skills.length).toBe(2)
})
