import { $getOriginSource, $isProxied } from './types'
import { isPrimitive } from './utils'

export function toJS(observableThing: any) {
  if (isPrimitive(observableThing)) return observableThing
  if (observableThing[$isProxied]) {
    return observableThing[$getOriginSource]
  }
}
