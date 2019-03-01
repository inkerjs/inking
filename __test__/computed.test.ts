import { autorun, createComputed, observable } from '../src/index'
import { buffer, getPlainObj } from './utils'

test('read computed value from observable value', () => {
  const obj = observable(getPlainObj())
  const b = buffer()

  const c1 = createComputed(() => {
    return obj.skills.join('_')
  })

  autorun(() => {
    b(c1.get())
  })

  obj.skills.push('code1')
  obj.skills.unshift('code2')
  obj.skills.pop()
  obj.skills.shift()
  obj.skills[0] = 'EAT'
  expect(b.toArray()).toEqual([
    'eat_sleep',
    'eat_sleep_code1',
    'code2_eat_sleep_code1',
    'code2_eat_sleep',
    'eat_sleep',
    'EAT_sleep'
  ])
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
