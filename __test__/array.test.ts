import { autorun, observable } from '../src/index'

function buffer() {
  const b: any[] = []
  const res = (newValue: any) => {
    b.push(newValue)
  }
  res.toArray = () => {
    return b
  }
  return res
}

const getPlainObj = () => ({
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

test('observer of array', () => {
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
