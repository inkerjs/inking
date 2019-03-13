import { autorun, computed, observable, reaction } from '../src/index'
import { buffer, getPlainObj } from './utils'

test('1', () => {
  const obj = observable(getPlainObj())
  const b = buffer()

  const c1 = computed(() => {
    return obj.skills.join('_').toLowerCase()
  })

  autorun(() => {
    b(c1.get())
  })

  obj.skills.push('code')
  obj.skills[2] = 'newCode'
  obj.skills[2] = 'NEWCODE'

  // expect(b.toArray()).toEqual(['eat_sleep', 'code_eat_sleep', 'newcode_eat_sleep'])
  expect(b.toArray()).toEqual(['eat_sleep', 'eat_sleep_code', 'eat_sleep_newcode'])
})

test('2', () => {
  const b1 = buffer()
  const b2 = buffer()
  @observable
  class Person {
    public firstName = 'a'
    public lastName = 'b'
    public arr: any[] = [1, 2, 3]
    public get fullName() {
      return `${this.firstName}_${this.lastName}`.toUpperCase()
    }
  }

  const p = new Person()

  autorun(() => {
    b1(p.fullName)
  })

  autorun(() => {
    b2(`${p.firstName} ${p.fullName}`)
  })

  p.firstName = 'A'
  p.firstName = 'a'
  p.firstName = 'newA'
  p.firstName = 'NEWA'

  expect(b1.toArray()).toEqual(['A_B', 'NEWA_B'])
  expect(b2.toArray()).toEqual(['a A_B', 'A A_B', 'a A_B', 'newA NEWA_B', 'NEWA NEWA_B'])
})

test('3', () => {
  const b1 = buffer()
  const b2 = buffer()
  @observable
  class Person {
    public firstName = 'David'
    public lastName = 'Beckham'
    public get fullName() {
      return `${this.firstName}_${this.lastName}`.toUpperCase()
    }
  }

  const p = new Person()

  autorun(() => {
    b1(p.fullName)
  })

  autorun(() => {
    b2(`${p.firstName} ${p.fullName}`)
  })

  p.firstName = 'DAVID'
  p.firstName = 'David2'
  p.firstName = 'DAVID2'

  expect(b1.toArray()).toEqual(['DAVID_BECKHAM', 'DAVID2_BECKHAM'])
  expect(b2.toArray()).toEqual([
    'David DAVID_BECKHAM',
    'DAVID DAVID_BECKHAM',
    'David2 DAVID2_BECKHAM',
    'DAVID2 DAVID2_BECKHAM'
  ])
})
