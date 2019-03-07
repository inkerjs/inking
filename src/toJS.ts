import { $getOriginSource, $isAtom } from './types'

export function toJS(mayObservableObj: any) {
  if (mayObservableObj[$isAtom]) {
    return mayObservableObj[$getOriginSource]
  }
  return mayObservableObj
}
