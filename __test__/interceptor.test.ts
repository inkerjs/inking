import { intercept, observable } from '../src/index'
import { buffer, getPlainObj } from './utils'

test('prop intercept', () => {
  const o = observable(getPlainObj())
  intercept(o, 'name', change => {
    if (change.oldValue.toLowerCase() === change.newValue.toLowerCase()) {
      return null
    } else {
      return change
    }
  })

  o.name = 'ADAM'
  expect(o.name).toBe('Adam')
  o.name = 'david'
  expect(o.name).toBe('david')
})

test('prop intercept', () => {
  const o = observable(getPlainObj())
  intercept(o.pets[0], 'name', change => {
    if (change.oldValue.toLowerCase() === change.newValue.toLowerCase()) {
      return null
    } else {
      return change
    }
  })

  o.pets[0].name = 'CATHY'
  expect(o.pets[0].name).toBe('Cathy')
})
