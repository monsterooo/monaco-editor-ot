
// WrappedOperation包含一个operation和对应的meta。
class WrappedOperation {
  constructor(operation, meta) {
    this.wrapped = operation;
    this.meta = meta;
  }
  apply(...args) {
    return this.wrapped.apply.apply(this.wrapped, args);
  }
  invert() {
    console.log('WrappedOperation 未实现');
  }
}

export default WrappedOperation;