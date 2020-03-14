import AwaitingConfirm from './AwaitingConfirm';

class AwaitingWithBuffer {
  constructor(outstanding, buffer) {
    this.outstanding = outstanding;
    this.buffer = buffer;
  }
  applyClient(client, operation) {
    try {
      const newBuffer = this.buffer.compose(operation);
      return new AwaitingWithBuffer(this.outstanding, newBuffer);
    } catch (e) {
      debugger;
    }
    
  }
  applyServer(client, operation) {
    const transform = operation.constructor.transform;
    const pair1 = transform(this.outstanding, operation);
    const pair2 = transform(this.buffer, pair1[1]);
    client.applyOperation(pair2[1]);
    return new AwaitingWithBuffer(pair1[0], pair2[0]);
  }
  // 已经确认了挂起的操作调用客户端发送操作然后继续等待确认
  serverAck(client) {
    client.sendOperation(client.revision, this.buffer);
    return new AwaitingConfirm(this.buffer);
  }
  transformSelection(selection) {
    console.log('AwaitingWithBuffer transformSelection');
  }
  resend(client) {
    console.log('AwaitingWithBuffer resend');
  }
}

export default AwaitingWithBuffer;