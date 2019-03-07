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

test('observable of array', () => {
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

test('inherit action method', () => {
  const b = buffer()
  const proto = {
    changeName() {
      /* tslint:disable */
      this.name = 'David'
    }
  }
  const obj = Object.create(proto)
  obj.name = 'Adam'
  const o = observable(obj)

  autorun(() => {
    b(o.name)
  })

  o.changeName()

  expect(o.name).toBe('David')
  expect(b.toArray()).toEqual(['Adam', 'David'])
})

test('@observable', () => {
  const b1 = buffer()
  const b2 = buffer()
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
    b1(p.skills[0])
    b2(p.name)
  })

  p.addSkills('code1')
  p.name = 'David'
  expect(b1.toArray()).toEqual(['eat', 'code1', 'code1'])
  expect(b2.toArray()).toEqual(['Adam', 'Adam', 'David'])
})
