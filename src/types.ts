export const $getRootCache = Symbol(`return root pathCache`)
export const $getPath = Symbol(`get current prop path!`)
export const $notGetter = Symbol(`not a getter`)
export const $isProxied = Symbol(`I'm a Observable Atom!`)
export const $getOriginSource = Symbol(`Return the origin plain object from proxy`)
export type primitiveType = string | number | boolean | symbol | null | undefined
export type IDecoratorPropsRestArgs = string[] | void[]
