// import { observable, reaction } from '../src/index'
// import { buffer, getPlainObj } from './utils'

// test('basic', () => {
//   const obj = observable(getPlainObj())
//   const b = buffer()

//   reaction(
//     () => obj.skills.length,
//     () => {
//       b(obj.skills[obj.skills.length - 1])
//     }
//   )

//   obj.skills.push('code1')
//   obj.skills.unshift('code2')
//   obj.skills.pop()
//   obj.skills.shift()
//   obj.skills[0] = 'EAT'

//   expect(b.toArray()).toEqual(['code1', 'code1', 'sleep', 'sleep'])
// })

// test('basic2', () => {
//   const obj = observable(getPlainObj())
//   const b = buffer()

//   reaction(
//     () => obj.skills[0],
//     () => {
//       b(obj.skills.length)
//     }
//   )

//   obj.skills.push('code1')
//   obj.skills.unshift('code2')
//   obj.skills.pop()
//   obj.skills.shift()
//   obj.skills[0] = 'EAT'

//   expect(b.toArray()).toEqual([4, 2, 2])
// })
