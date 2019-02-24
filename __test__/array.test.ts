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
  obj.skills.push('code')
  expect(obj.skills.slice()).toEqual(['eat', 'sleep'])
})
