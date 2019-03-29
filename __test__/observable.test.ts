import { action, autorun, observable, toJS } from '../src/index'
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

test('replace object', () => {
  const obj = observable(getPlainObj())
  const b = buffer()
  autorun(() => {
    b(obj.family.father.name + '_' + obj.family.mother.name)
  })
  obj.family = {
    father: {
      name: 'a'
    },
    mother: { name: 'b' }
  }

  expect(b.toArray()).toEqual(['daddy_mummy', 'a_b'])
})

test('Object.keys', () => {
  const obj = observable(getPlainObj())
  const b = buffer()
  autorun(() => {
    b(Object.keys(obj.family).join('_'))
  })

  obj.family = {
    a: 1,
    b: 1,
    c: 1
  }
  obj.family.d = 1
  obj.family = { e: 1, f: 1, g: 1 }

  expect(b.toArray()).toEqual(['father_mother', 'a_b_c', 'a_b_c_d', 'e_f_g'])
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

test('native Object method', () => {
  const obj = observable(getPlainObj())

  expect(Object.getOwnPropertyNames(obj)).toEqual(['name', 'family', 'pets', 'skills'])
  expect(Object.getOwnPropertyNames(obj.family)).toEqual(['father', 'mother'])
  expect(Object.getOwnPropertyNames(obj.pets)).toEqual(['0', 'length'])
  expect(Object.getOwnPropertyNames(obj.skills)).toEqual(['0', '1', 'length'])

  expect(Object.keys(obj)).toEqual(['name', 'family', 'pets', 'skills'])
  expect(Object.keys(obj.family)).toEqual(['father', 'mother'])
  expect(Object.keys(obj.pets)).toEqual(['0'])
  expect(Object.keys(obj.skills)).toEqual(['0', '1'])
})

test('dynamic properties', () => {
  const obj = observable(getPlainObj())
  const b = buffer()

  obj.friends = [
    {
      name: 'Jack',
      age: 25
    }
  ]

  autorun(() => {
    b(obj.friends[0].age)
  })

  obj.friends[0].age = 26

  expect(b.toArray()).toEqual([25, 26])
})

test('nested native Object method', () => {
  const obj = observable(getPlainObj())

  const addToStart = thing => {
    obj.skills.unshift(thing)
  }

  const addToEnd = thing => {
    obj.skills.push(thing)
  }

  const add = thing => {
    addToStart(thing)
    addToEnd(thing)
  }

  add('xxx')
  expect(toJS(obj.skills)).toEqual(['xxx', 'eat', 'sleep', 'xxx'])
})

test('replace nested object', () => {
  const obj = observable(getPlainObj())
  const b1 = buffer()
  const b2 = buffer()
  autorun(() => {
    b1(`${obj.family.father.name}_${obj.family.mother.name}`)
  })

  autorun(() => {
    b2(obj.skills.join('_'))
  })

  obj.family = {
    father: {
      name: 'dad'
    },
    mother: {
      name: 'mom'
    }
  }

  obj.skills.push('code')
  obj.skills = ['a', 'b']

  expect(b1.toArray()).toEqual(['daddy_mummy', 'dad_mom'])
  expect(b2.toArray()).toEqual(['eat_sleep', 'eat_sleep_code', 'a_b'])
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

    public addSkillsToStart(newSkill: string) {
      this.skills.unshift(newSkill)
    }
  }

  const p = new Person()

  autorun(() => {
    b1(p.skills[0])
    b2(p.name)
  })

  p.addSkillsToStart('code1')
  // p.name = 'David'
  expect(b1.toArray()).toEqual(['eat', 'code1'])
  expect(b2.toArray()).toEqual(['Adam', 'Adam'])
})

test('@observable with arguments', () => {
  const b1 = buffer()
  const b2 = buffer()
  const b3 = buffer()
  @observable('name', 'family')
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
    b2(p.pets[0].name)
  })

  autorun(() => {
    b3(p.name)
  })

  p.addSkills('code1')
  p.pets[0].name = 'Jessie'
  p.name = 'David'
  expect(b1.toArray()).toEqual(['eat'])
  expect(b2.toArray()).toEqual(['Cathy'])
  expect(b3.toArray()).toEqual(['Adam', 'David'])
})

test('tracking of new property', () => {
  @observable
  class Obj {
    public arr: any[] = [1, 2, 3]
  }

  const p = new Obj()

  p.arr.push(4)
  expect(toJS(p.arr)).toEqual([1, 2, 3, 4])
  p.arr[2] = 'new 3'
  expect(toJS(p.arr)).toEqual([1, 2, 'new 3', 4])
  p.arr[3] = 'new 4'
  expect(toJS(p.arr)).toEqual([1, 2, 'new 3', 'new 4'])
})

test('cross object observe', () => {
  const buf = buffer()
  @observable
  class A {
    public arr: any[] = [1, 2, 3]
  }
  const a = new A()

  @observable
  class B {
    public get aLength() {
      return a.arr.length
    }
  }

  const b = new B()
  autorun(() => buf(b.aLength))

  expect(b.aLength).toBe(3)
  a.arr[0] = 1
  a.arr.unshift(0)
  expect(b.aLength).toBe(4)
  expect(buf.toArray()).toEqual([3, 4])
})
