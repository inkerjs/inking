import { observable } from '../src/index'

const obj = observable({
  name: 'Adam',
  family: {
    father: {
      name: 'daddy'
    },
    mother: {
      name: 'mummy'
    }
  },
  pets: [
    {
      type: 'cat',
      name: 'Cathy'
    }
  ],
  skills: ['eat', 'sleep']
})

test('native method of array', () => {
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
