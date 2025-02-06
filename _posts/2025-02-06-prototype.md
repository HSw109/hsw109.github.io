---
title: JavaScript prototype pollutions cheatsheet
date: 2025-02-02 21:25:30 
categories: [Write-ups, cheatsheet]
tags:      
description: \/
hidden: true
---

## Basic knowledge

### What is a prototype in JavaScript?

Every object in JavaScript is linked to another object of some kind, known as its prototype. By default, JavaScript automatically assigns new objects one of its built-in prototypes. For example, strings are automatically assigned the built-in String.prototype. You can see some more examples of these global prototypes below: 

```js
let myObject = {};
Object.getPrototypeOf(myObject);    // Object.prototype

let myString = "";
Object.getPrototypeOf(myString);    // String.prototype

let myArray = [];
Object.getPrototypeOf(myArray);	    // Array.prototype

let myNumber = 1;
Object.getPrototypeOf(myNumber);    // Number.prototype
```
 Objects automatically inherit all of the properties of their assigned prototype, unless they already have their own property with the same key. This enables developers to create new objects that can reuse the properties and methods of existing objects.

The built-in prototypes provide useful properties and methods for working with basic data types. For example, the String.prototype object has a toLowerCase() method. As a result, all strings automatically have a ready-to-use method for converting them to lowercase

### How prototype works

Whenever you reference a property of an object, the JavaScript engine first tries to access this directly on the object itself. If the object doesn't have a matching property, the JavaScript engine looks for it on the object's prototype instead

Example: toString not a property of myObject, but it is a property of Object.prototype

```js
let myObject = {};
myObject.toString(); // "[object Object]"
```

### Prototype chain

The prototype chain is the order in which the JavaScript engine looks for properties and methods. When you reference a property or method, the JavaScript engine searches for it on the object itself, then on its prototype, and so on until it finds the property or reaches the end of the chain.
Note that an object's prototype is just another object, which should also have its own prototype, and so on. 

![prototype1](/commons/cheatsheet/prototype/prototype1.png)

Means that the `username` object has access to the properties and methods of both `String.prototype` and `Object.prototype`

### Accessing an object's prototype using `__proto__`

The `__proto__` property is a reference to the prototype object of the object. It is both getter and setter.

You can access `__proto__` using either bracket or dot notation:

```js
username.__proto__
username['__proto__']
```
And chain up:

```js
username.__proto__                        // String.prototype
username.__proto__.__proto__              // Object.prototype
username.__proto__.__proto__.__proto__    // null
```

## Prototype pollution

Prototype pollution is a vulnerability that allows an attacker to modify the prototype of an object. This can be used to overwrite existing properties or add new properties to the targeted object.

![](/commons/cheatsheet/prototype/prototype2.png)

The attacker can pollute the prototype with properties containing harmful values, which may subsequently be used by the application in a dangerous way.

It's possible to pollute any prototype object, but this most commonly occurs with the built-in global `Object.prototype`.

Successful exploitation of prototype pollution requires the following key components:

1. A prototype pollution source - This is any input that enables you to poison prototype objects with arbitrary properties.
2. A sink - In other words, a JavaScript function or DOM element that enables arbitrary code execution.
3. An exploitable gadget - This is any property that is passed into a sink without proper filtering or sanitization.

### Prototype pollution source
#### Prototype pollution via the URL

Consider the following URL, which contains an attacker-constructed query string:

```
https://vulnerable-website.com/?__proto__[evilProperty]=payload
```

The attacker can use this URL to pollute the prototype of the global `Object.prototype` object. When breaking the query string down into key:value pairs, a URL parser may interpret `__proto__` as an arbitrary string.

You might think that the `__proto__` property, along with its nested `evilProperty`, will just be added to the target object as follows:

```js
{
    existingProperty1: 'foo',
    existingProperty2: 'bar',
    __proto__: {
        evilProperty: 'payload'
    }
}
```

However, this isn't the case. At some point, the recursive merge operation may assign the value of `evilProperty` using a statement equivalent to the following:

```js
targetObject.__proto__.evilProperty = 'payload';
```




#### Prototype pollution via JSON input 

After the JSON.parse() function has parsed the attacker-supplied string, the `__proto__` property will be added to the target object.

```json
{
    "__proto__": {
        "evilProperty": "payload"
    }
}
```
```js
const objectLiteral = {__proto__: {evilProperty: 'payload'}};
const objectFromJson = JSON.parse('{"__proto__": {"evilProperty": "payload"}}');

objectLiteral.hasOwnProperty('__proto__');     // false
objectFromJson.hasOwnProperty('__proto__');    // true
```


### Prototype pollution sink
A prototype pollution sink is essentially just a JavaScript function or DOM element that you're able to access via prototype pollution, which enables you to execute arbitrary JavaScript or system commands.


