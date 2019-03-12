<p align="center">
    <h1 align="center">Tinar</h1>
    <p align="center">
        Lightweight MobX like date management library based on <a target="_blank" href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy">Proxy</a>.
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

### Road of map

Althogh some unit tests is provided. Howerver, Tinar is still in prototype phase. It lacks an important feature —— **the update status between reaction nodes**. For example:

```javascript
const person = @observable({
    firstName: 'Beckham',
	lastName: 'David',
    get fullname1(){
        return `${this.lastName}_${firstName}.toUpperCase()`
    }
})

const auto1 = autorun(()=>{
    console.log(person.fullname)
})

const auto2 = autorun(()=>{
    console.log(`${person.firstName} ${person.fullname}`)
})

person.firstName = 'Beckham2'
person.firstName = 'BECKHAM2'
```

Ideally, the result should be: 

```js
$ DAVID_BECKHAM
$ Beckham DAVID_BECKHAM
$ DAVID_BECKHAM2
$ Beckham2 DAVID_BECKHAM2
$ BECKHAM2 DAVID_BECKHAM2
```

MobX will output right result. But Tinar and some other lightweight observable data library like [nx-js]() and [dob]() won't output right beacause of the duplicate trigger of reaction. But the update status between reaction nodes is a bit difficult for the time being. I hope to figure out how exactly MobX solves or figure out a easier way. You are welcomed to leave a issue if you have any idea how to solve or anything else about Tinar.

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
- [ ] @computed
- [x] autorun
- [x] when
- [x] reaction
- [ ] @observer

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
