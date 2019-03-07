import { autorun, observable, toJS } from '../src/index'
import { buffer, getPlainObj } from './utils'

test('basic toJS', () => {
  const obj = observable(getPlainObj())
  const skills = obj.skills
  expect(toJS(obj)).toEqual(getPlainObj())
  expect(toJS(skills)).toEqual(getPlainObj().skills)
})

test('toJS after modification', () => {
  const plainObj = getPlainObj()
  const obj = observable(getPlainObj())
  obj.skills.unshift('xx')
  plainObj.skills.unshift('xx')
  expect(toJS(obj)).toEqual(plainObj)
  obj.family.father.name = 'DADDY'
  plainObj.family.father.name = 'DADDY'
  expect(toJS(obj)).toEqual(plainObj)
  obj.pets = [
    {
      type: 'alligator',
      name: 'killer'
    }
  ]
  plainObj.pets = [
    {
      type: 'alligator',
      name: 'killer'
    }
  ]
  expect(toJS(obj)).toEqual(plainObj)
})
