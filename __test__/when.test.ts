import { observable, when } from '../src/index'
import { buffer, getPlainObj } from './utils'

test('basic', () => {
  const obj = observable(getPlainObj())
  const b = buffer()

  when(
    () => obj.skills.length >= 3,
    () => {
      b(obj.skills[obj.skills.length - 1])
    }
  )

  obj.skills.push('code1') // 3
  obj.skills.unshift('code2') // 4
  obj.skills.pop() // 3
  obj.skills.shift() // 2
  obj.skills[0] = 'EAT'

  expect(b.toArray()).toEqual(['code1', 'code1', 'sleep'])
})
