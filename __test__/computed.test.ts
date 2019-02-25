import { autorun, createComputed, observable } from '../src/index'
import { buffer, getPlainObj } from './utils'

test('read computed value from observable value', () => {
  const obj = observable(getPlainObj())
  const c1 = createComputed(() => {
    return obj.skills.join('_')
  })
  expect(c1.get()).toBe('eat_sleep')
})

test('autorun of computed', () => {
  const obj = observable(getPlainObj())
  const b = buffer()
  const c1 = createComputed(() => {
    return obj.skills.join('_')
  })
  autorun(() => {
    b(c1.get())
  })
  obj.skills.push('code')

  expect(b.toArray()).toEqual(['eat_sleep', 'eat_sleep_code'])
})
