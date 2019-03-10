export const $isProxied = Symbol(`I'm a Observable Atom!`)
export const $atomOfProxy = Symbol(`Return atom from proxy`)
export const $getOriginSource = Symbol(`Return the origin plain object from proxy`)
// export const $tinar = Symbol('tinar proxy')
export type primitiveType = string | number | boolean | symbol | null | undefined
export type IDecoratorPropsRestArgs = string[] | void[]
