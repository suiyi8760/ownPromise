// 三种状态
const PENDING = "pending";
const RESOLVED = "resolved";
const REJECTED = "rejected";

class MyPromise {
  constructor(fn) {
    // 状态
    this.status = PENDING;
    // 拒因
    this.rejectReason = null;
    // 终值
    this.value = null;
    // 同一个promise可以被多次then，状态改变会被同时触发
    this.resolvedCallbacks = [];
    this.rejectedCallbacks = [];
    // resolve实参
    const resolve = (value) => {
      setTimeout(() => {
        if (this.status === PENDING) {
          this.status = RESOLVED;
          this.value = value;
          this.resolvedCallbacks.forEach((cb) => cb(this.value));
        }
      });
    };
    // reject实参
    const reject = (reason) => {
      setTimeout(() => {
        if (this.status === PENDING) {
          this.status = REJECTED;
          this.reason = reason;
          this.rejectedCallbacks.forEach((cb) => cb(value));
        }
      })
    };
    try {
      fn(resolve, reject)
    } catch (err) {
      reject(err);
    }
  }
  // Promise.then
  then(onResolve, onReject) {
    // typeof onResolve === 'function' && this.resolvedCallbacks.push(onResolve);
    // typeof onReject === 'function' && this.resolvedCallbacks.push(onReject);
    // return this;
    // 如果 onFulfilled 不是函数且 promise1 成功执行， newPromise 必须成功执行并返回相同的值
    onResolve = typeof onResolve === 'function' ? onResolve : (value) => value;
    // 如果 onRejected 不是函数且 promise1 拒绝执行， newPromise 必须拒绝执行并返回相同的据因
    onReject = typeof onReject === 'function' ? onReject : (reason) => { throw reason; };
    let newPromise;

    // 2.2.6规范 对于一个promise，它的then方法可以调用多次.
    // 当在其他程序中多次调用同一个promise的then时 由于之前状态已经为FULFILLED / REJECTED状态，则会走以下逻辑,
    // 所以要确保为FULFILLED / REJECTED状态后 也要异步执行onFulfilled / onRejected ,这里使用setTimeout

    // 不论 promise1 被 reject 还是被 resolve 时 promise2 都会被 resolve，只有出现异常时才会被 rejected。
    // 由于在接下来的解决过程中需要调用resolve,reject进行处理,处理我们在调用处理过程时,传入参数

    if (this.status === PENDING) {
      return (newPromise = new MyPromise((resolve, reject) => {
        this.resolvedCallbacks.push((value) => {
          // 如果onFulfilled或者onRejected抛出异常，则newPromise必须reject
          try {
            // 如果onResolve返回一个值x，则运行下面的Promise解决过程[[Resolve]](promise2,x)
            let x = onResolve(value);
            resolvePromise(newPromise, x, resolve, reject);
          } catch (err) {
            reject(err);
          }
        });
        this.rejectedCallbacks.push((reason) => {
          try {
            // 如果onReject返回一个值x，则运行下面的Promise解决过程[[Resolve]](promise2,x)
            let x = onReject(reason);
            resolvePromise(newPromise, x, resolve, reject);
          } catch (err) {
            reject(err);
          }
        });
      }));
    }

    if (this.status === RESOLVED) {
      return (newPromise = new MyPromise((resolve, reject) => {
        try {
          let x = onResolve(this.value);
          resolvePromise(newPromise, x, resolve, reject);
        } catch (err) {
          reject(err);
        }
      }));
    }

    if (this.status === REJECTED) {
      return (newPromise = new MyPromise((resolve, reject) => {
        try {
          let x = onReject(this.reason);
          resolvePromise(newPromise, x, resolve, reject);
        } catch (err) {
          reject(err);
        }
      }));
    }
  }
}

function resolvePromise(newPromise, x, resolve, reject) {
  // 禁止循环引用
  if (newPromise === x) {
    return reject(new TypeError('loop reference'));
  }

  if (x instanceof MyPromise) {
    if (x.state === PENDING) {
      x.then((y) => resolvePromise(newPromise, y, resolve, reject), reject);
    } else {
      x.then(resolve, reject)
    }
    return;
  }

  if (x && (typeof x === 'function' && typeof x === 'object')) {
    // 防止then内参数多次调用
    let called = false;
    try {
      let _then = x.then;
      if (typeof _then === 'function') {
        _then.call(x, (y) => {
          if (called) return;
          called = true;
          resolvePromise(newPromise, y, resolve, reject);
        }, (reason) => {
          if (called) return;
          called = true;
          reject(reason);
        });
      } else {
        // 如果then不是函数，以x为参数执行promise
        resolve(x);
      }
    } catch (err) {
      if (called) return;
      called = true;
      reject(e);
    }
    return;
  }

  resolve(x);
}