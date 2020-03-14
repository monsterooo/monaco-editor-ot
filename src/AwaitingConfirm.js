import AwaitingWithBuffer from './AwaitingWithBuffer';
import { synchronized_ } from './Client';

// In the 'AwaitingConfirm' state, there's one operation the client has sent
// to the server and is still waiting for an acknowledgement.
// 有一个 operation 提交了但是等后台确认，本地没有编辑数据
class AwaitingConfirm {
  constructor(outstanding) {
    this.outstanding = outstanding;
  }
  applyClient(client, operation) {
    return new AwaitingWithBuffer(this.outstanding, operation);
  }
  applyServer(client, operation) {
    // 这是另一个客户的operation到来。可视化:
    //
    //                   /\
    // this.outstanding /  \ operation
    //                 /    \
    //                 \    /
    //  pair[1]         \  / pair[0] (new outstanding)
    //                   \/
    //
    const pair = operation.constructor.transform(this.outstanding, operation);
    client.applyOperation(pair[1]);
    return new AwaitingConfirm(pair[0]);
  }
  // 客户端的操作已被确认=>切换到同步状态
  serverAck() {
    return synchronized_;
  }
  transformSelection(selection) {
    console.log('AwaitingConfirm transformSelection');
  }
  // 因为客户端被断开连接，所以没有得到确认。现在它已经重新连接，我们重新发送未完成的操作
  resend(client) {
    console.log('AwaitingConfirm resend');
    client.sendOperation(client.revision, this.outstanding);
  }
}

export default AwaitingConfirm;