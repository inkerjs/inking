import { autorun, observable } from '../src/index'
import { buffer, getPlainObj } from './utils'

test('native method of array 1', () => {
  const obj = observable(getPlainObj())
  expect(obj.skills.slice()).toEqual(['eat', 'sleep'])
  obj.skills.push('code')
  expect(obj.skills.slice()).toEqual(['eat', 'sleep', 'code'])
  obj.skills.pop()
  obj.skills.push('play')
  obj.skills.splice(0, 0, 's1', 's2')
  expect(obj.skills.slice()).toEqual(['s1', 's2', 'eat', 'sleep', 'play'])
  obj.skills.shift()
  obj.skills.pop()
  expect(obj.skills.slice()).toEqual(['s2', 'eat', 'sleep'])
  expect(obj.skills.concat()).toEqual(['s2', 'eat', 'sleep'])
})

test('native modify method 2', () => {
  const obj = observable(getPlainObj())
  const b = buffer()
  autorun(() => {
    b(obj.skills.length)
  })
  obj.skills.push('code')
  obj.skills.unshift('code')
  obj.skills.pop()
  obj.skills.shift()
  obj.skills[0] = 'eat'
  expect(b.toArray()).toEqual([2, 3, 4, 3, 2])
})

test('native method of array 3', () => {
  const obj = observable(getPlainObj())
  const b = buffer()
  autorun(() => {
    b(obj.skills[0])
  })
  obj.skills.push('code')
  obj.skills.pop()
  obj.skills.push('play')
  obj.skills.splice(0, 0, 's1')
  obj.skills.shift()
  obj.skills.pop()
  obj.skills[0] = 'say'
  expect(b.toArray()).toEqual(['eat', 's1', 'eat', 'say'])
})

/* tslint:disable */
test('native method of array 4', () => {
  const todos = observable([{ title: 'a', completed: true }, { title: 'b', completed: false }])
  const b = buffer()

  autorun(() => {
    b(
      todos
        .filter(todo => !todo.completed)
        .map(todo => todo.title)
        .join('_')
    )
  })

  todos[0].completed = false // a_b
  todos[1].completed = true // a
  todos.push({ title: 'c', completed: false }) // a_c
  todos.pop() // a
  todos.shift() // ''
  expect(b.toArray()).toEqual(['b', 'a_b', 'a', 'a_c', 'a', ''])
})
