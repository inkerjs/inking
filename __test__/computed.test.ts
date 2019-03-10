import { action, autorun, computed, observable } from '../src/index'
import { buffer, getPlainObj } from './utils'

test('read computed value from observable value', () => {
  const obj = observable(getPlainObj())
  const b = buffer()

  const c1 = computed(() => {
    return obj.skills.join('_')
  })

  autorun(() => {
    b(c1.get())
  })

  obj.skills.push('code1')
  obj.skills.unshift('code2')
  obj.skills.pop()
  obj.skills.shift()
  obj.skills[0] = 'EAT'
  expect(b.toArray()).toEqual([
    'eat_sleep',
    'eat_sleep_code1',
    'code2_eat_sleep_code1',
    'code2_eat_sleep',
    'eat_sleep',
    'EAT_sleep'
  ])
})

test('autorun of computed', () => {
  const obj = observable(getPlainObj())
  const b = buffer()
  const c1 = computed(() => {
    return obj.skills.join('_')
  })
  autorun(() => {
    b(c1.get())
  })
  obj.skills.push('code')

  expect(b.toArray()).toEqual(['eat_sleep', 'eat_sleep_code'])
})

test('equals', () => {
  const obj = observable(getPlainObj())
  const b = buffer()

  const c1 = computed(
    () => {
      return obj.skills.join('_')
    },
    {
      equals: (oldValue: string, newValue: string) => oldValue.toLowerCase() === newValue.toLowerCase()
    }
  )

  autorun(() => {
    b(c1.get())
  })

  obj.skills[0] = 'eAt'
  obj.skills.unshift('code')
  obj.skills[2] = 'SLEEP'
  obj.skills[0] = 'CODE'

  expect(b.toArray()).toEqual(['eat_sleep', 'code_eAt_sleep'])
})

// test('@computed', () => {
//   const b1 = buffer()
//   const b2 = buffer()

//   @observable
//   class Person {
//     public name = 'Adam'
//     public family = {
//       father: {
//         name: 'daddy'
//       },
//       mother: {
//         name: 'mummy'
//       }
//     }
//     public pets = [
//       {
//         type: 'cat',
//         name: 'Cathy'
//       }
//     ]

//     public skills: string[] = ['eat', 'sleep']

//     public get skillsCount() {
//       return this.skills.length
//     }

//     public addSkills(newSkill: string) {
//       this.skills.unshift(newSkill)
//     }
//   }

//   const p = new Person()

//   autorun(() => {
//     b1(p.skillsCount)
//   })

//   action(() => {
//     p.addSkills('code')
//   })()

//   expect(b1.toArray()).toEqual([2, 3])
//   // expect(b2.toArray()).toEqual(['Adam', 'Adam', 'David'])
// })

// TODO: add `spy` for debug?
// test('lazy recompute', () => {
//   const obj = observable(getPlainObj())
//   const b = buffer()

//   const c1 = createComputed(() => {
//     return obj.skills.join('_')
//   })

//   autorun(() => {
//     b(c1.get())
//   })
// })
