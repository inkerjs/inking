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

## Usage

### Making things observable

<details>
<summary><strong>observable</strong></summary>

**API:**

`observable(object)`

**EXAMPLE:**

```ts
import { observable, autorun } from 'tinar'

const counter = observable({ num: 0 })
const countLogger = observe(() => console.log(counter.num))

counter.num++
// $ 1
```

</details>
<details>
<summary><strong>@observable</strong></summary>

**API:**

```ts
@observable
class Model {
    ...
}
```

**EXAMPLE:**

```ts
import { observable } from 'tinar'

@observable
class Model {
  count = 0
}

const m = new Model()
autorun(() => {
  console.log(m.count)
})

m.count++
// $ 1
```

</details>
<details>
<summary><strong>object</strong></summary>

Any plain object passed into `observable` will turn to be a observable value.

**EXAMPLE:**

```ts
import { observable } from 'tinar'

const person = observable({
  // observable properties:
  name: 'John',
  age: 25,
  showAge: false,

  // computed property:
  get labelText() {
    return `${this.name} (age: ${this.age})`
  },

  setAge(age) {
    this.age = age
  }
})

autorun(() => console.log(person.labelText))

person.name = 'David'
// $: David (age: 25)
person.setAge(26)
// $: David (age: 26)
```

</details>

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

## Platform support

- Node: 6+
- Chrome: 49+
- Firefox: 38+
- Safari: 10+
- Edge: 12+
- Opera: 36+
- IE: NEVER SUPPORTED
