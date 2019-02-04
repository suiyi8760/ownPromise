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
          this.resolvedCallbacks.forEach((cb) => this.value = cb(this.value));
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
  then(onResolve,onReject) {
    typeof onResolve === 'function' && this.resolvedCallbacks.push(onResolve);
    typeof onReject === 'function' && this.resolvedCallbacks.push(onReject);
    return this;
  }
}