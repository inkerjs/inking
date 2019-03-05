import { action, autorun, observable } from '../src/index'
import { buffer, getPlainObj } from './utils'

test('key/value access right', () => {
  const o = observable(getPlainObj())
  expect(o.name).toBe('Adam')
  expect(o.family.father.name).toBe('daddy')
  expect(o.pets[0].name).toBe('Cathy')
  expect(o.pets.length).toBe(1)
  expect(o.skills[0]).toBe('eat')
  expect(o.skills.length).toBe(2)
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

test('@observer', () => {
  const b = buffer()
  @observable
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

    public addSkills(newSkill: string) {
      this.skills.unshift(newSkill)
    }
  }

  const p = new Person()

  autorun(() => {
    b(p.skills[0])
  })

  p.skills.unshift('code1')
  p.skills.push('code2')

  expect(b.toArray()).toEqual(['eat', 'code1'])
})
