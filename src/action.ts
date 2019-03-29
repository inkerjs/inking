import { globalState } from './globalState'
// import { endBatch, startBatch } from './observer'

export function runInTransaction(name: string, boundFn: (...args: any[]) => any, args: any[]) {
  // startBatch()
  globalState.enterSet()
  try {
    // bind `this` of fn before into runInTransaction
    return boundFn(...args)
  } finally {
    // endBatch()
    globalState.exitSet()
  }
}

function createAction(name: string, fn: (...args: any[]) => any, _this?: any) {
  return (...args: any[]) => {
    const boundFn = fn.bind(null || _this)
    runInTransaction(name, boundFn, args)
  }
}

function actionDecorator(target: any, propertyKey: string, baseDescriptor: PropertyDescriptor) {
  const fn = baseDescriptor.value
  return {
    get() {
      return (...args: any[]) => {
        /* tslint:disable */
        return runInTransaction('', fn.bind(this), args)
      }
    }
  }
}

export function action(fn: (...args: any[]) => any): Function
export function action(name: string, fn: (...args: any[]) => any): Function
export function action(target: Object, propertyKey: string, baseDescriptor?: PropertyDescriptor): void

export function action(arg1, arg2?, arg3?): any {
  // action(fn() {})
  if (arguments.length === 1 && typeof arg1 === 'function') {
    return createAction('<anonymous action>', arg1)
  }
  // action("name", fn() {})
  if (arguments.length === 2 && typeof arg2 === 'function') {
    return createAction(arg1, arg2)
  }

  // @action fn() {}
  if (arguments.length === 3) {
    return actionDecorator.call(null, arg1, arg1.constructor.name + '.' + arg2, arg3)
  }
}
