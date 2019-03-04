import { action, autorun, observable } from '../src/index'
import { buffer, getPlainObj } from './utils'

test('action transaction', () => {
  const obj = observable(getPlainObj())
  const b = buffer()

  autorun(() => {
    b(obj.name)
  })

  const act = action(() => {
    obj.name = 't1'
    obj.name = 't2'
    obj.name = 't3'
  })

  act()

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

  const act = action(() => {
    obj.skills.unshift('i1')
    obj.skills.unshift('i2')
    obj.skills.pop()
    obj.skills.splice(0, 2, 'i3')
    obj.skills.shift()
  })

  act()
  expect(b1.toArray()).toEqual([2, 1])
  expect(b2.toArray()).toEqual(['sleep', undefined])
  expect(b3.toArray()).toEqual(['eat_sleep', 'eat'])
})

test('action with arguments', () => {
  const obj = observable(getPlainObj())
  const b1 = buffer()

  autorun(() => {
    b1(obj.skills.length)
  })

  const act = action((time: number) => {
    for (let i = 0; i < time; i++) {
      obj.skills.unshift(`i1`)
    }
  })

  act(3)
  expect(b1.toArray()).toEqual([2, 5])
})

test('@action', () => {
  class Person {
    public name = 'Adam'
    public family = {
      father: {
        name: 'daddy'
      },
      mother: {
        name: 'mummy'
      }
    }
    public pets = [
      {
        type: 'cat',
        name: 'Cathy'
      }
    ]

    public skills: string[] = ['eat', 'sleep']

    @action
    public addSkills(newSkill: string) {
      this.skills.unshift(newSkill)
    }
  }

  const p = new Person()
  p.addSkills('code1')
  expect(p.skills[0]).toEqual('code1')
})
