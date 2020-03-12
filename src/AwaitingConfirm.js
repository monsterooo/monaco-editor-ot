import AwaitingWithBuffer from './AwaitingWithBuffer';

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
}

export default AwaitingConfirm;