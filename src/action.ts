import { endBatch, startBatch } from './observer'

export function runInTransaction(name: string, fn: (...args: any[]) => any, args: any[]) {
  startBatch()
  try {
    return fn.apply(null, args)
  } finally {
    endBatch()
  }
}

function createReaction(name: string, fn: (...args: any[]) => any) {
  return (...args: any[]) => {
    runInTransaction(name, fn, args)
  }
}

// function actionDecorator(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
//   const func = descriptor.value
//   return {
//     get() {
//       return (...args: any[]) => {
//         return runInAction(func.bind(this, ...args), propertyKey)
//       }
//     }
//   }
// }

export function action(fn: (...args: any[]) => any): Function
export function action(name: string, fn: (...args: any[]) => any): Function
export function action(target: Object, propertyKey: string, baseDescriptor?: PropertyDescriptor): PropertyDescriptor

export function action(arg1, arg2?, arg3?): any {
  // action(fn() {})
  if (arguments.length === 1 && typeof arg1 === 'function') {
    return createReaction('<anonymous action>', arg1)
  }
  // action("name", fn() {})
  if (arguments.length === 2 && typeof arg2 === 'function') {
    return createReaction(arg1, arg2)
  }

  // @action fn() {}
  if (arguments.length === 3) {
    // return actionDecorator.call(null, arg1, arg1.constructor.name + '.' + arg2, arg3)
  }
}
