
class AwaitingWithBuffer {
  constructor(outstanding, buffer) {
    this.outstanding = outstanding;
    this.buffer = buffer;
  }
  applyClient(client, operation) {
    const newBuffer = this.buffer.compose(operation);
    return AwaitingWithBuffer(this.outstanding, newBuffer);
  }
}

export default AwaitingWithBuffer;