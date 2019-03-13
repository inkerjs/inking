<p align="center">
    <h1 align="center">Tinar</h1>
    <p align="center">
        Lightweight MobX like date management library based on ES2015 <a target="_blank" href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy">Proxy</a>.
    <p>
    <p align="center">
        <i>
            <a href="https://www.npmjs.com/package/tinar">
              <img src="https://img.shields.io/npm/v/tinar.svg?color=%2361AFEF" alt="NPM Version">
            </a>
            <a href="https://circleci.com/gh/tinarjs/tinar">
              <img src="https://img.shields.io/circleci/project/github/tinarjs/tinar/master.svg" alt="Build Status">
            </a>
<a href='https://coveralls.io/github/fi3ework/tinar?branch=master'><img src='https://coveralls.io/repos/github/fi3ework/tinar/badge.svg?branch=master&amp;t=CTNsds' alt='Coverage Status' /></a>
        </i>
    </p>
</p>

## Install

```
$ yarn add tinar
```

## Motivation

[Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) is an awesome feature feature of ES2015. Base on it, we can do meta-programming and hijack object's native operations easier and more seamless. Tinar is a state manage library based on Proxy and inspired by awesome [MobX](https://github.com/mobxjs/mobx).

## Concept

- Just Like MobX, the object Tinar return is not a plain object, but an Observable or Computed object which is hijacked by Proxy. All `get` and `set` operations are hijacked, which makes it possible to collect dependencies on trigger reactions.
- A very important issue is that the Computed value needs to be triggered when it is actually updated. Many lightweight class MobX libraries don't implement it, which causes repeated reaction triggers. Tinar start a transaction with the call to `set` and the function(AOP by Proxy). The reaction triggered in the transaction will not be invoked immediately, but staged and there will only be one copy in stash. And at the end of the outermost transaction, all the reactions will be triggered.
- Although some test cases have been added, Tinar is still in a prototype phase and needs `tinar-react` and Devtools.
- Feel free to leave any message in the issue.

中文：

- 就像 MobX 一样，Tinar 返回的对象并不是一个 plain object，而是通过 Proxy 代理的一个 Observable 或者 Computed 对象，所有的 get set 操作都会被劫持，这也使得收集依赖于触发反应成为了可能。
- 有一个很重要的问题就是 Computed 值需要在真正更新时再触发，很多轻量的类 MobX 库没有做到这一点，这会导致重复的反应触发，Tinar 通过对 `set` 与函数调用的开始与结束进行事务操作，在事务中触发的 reaction 会被暂存而不会触发，并且只会有 one copy，在最外层事务结束的时候，再去触发所有的 reactions。
- 尽管添加了一些测试样例，但是 Tinar 还处于一个原型阶段，还需要 `tinar-react` 和 Devtools
- 欢迎在 issue 中畅所欲言。

## Usage

### Making things observable

- [x] observable
- [x] @observable
- [x] objects
- [x] arrays
- [ ] maps
- [ ] boxed values
- [ ] decorators

### Reacting to observables

- [x] computed
- [x] @computed
- [x] autorun
- [x] when
- [x] reaction
- [x] @observer

### Changing observables

- [x] action
- [ ] async actions & flows
- [ ] Object api

### Utility functions

- [x] toJS
- [ ] extendObservable
- [ ] createAtom
- [ ] intercept & observe

### Others

- [ ] Devtools
