import Synchronized from './Synchronized';
import AwaitingConfirm from './AwaitingConfirm';
import AwaitingWithBuffer from './AwaitingWithBuffer';

// 单例
const synchronized_ = new Synchronized();

class Client {
  constructor(revision) {
    this.revision = revision;
    this.state = synchronized_;
  }
  setState(state) {
    this.state = state;
  }
  // 当用户更改编辑器时调用此方法更改状态
  applyClient(operation) {
    this.setState(this.state.applyClient(this, operation));
  }
  // 来自服务器的新操作调用此方法
  applyServer(operation) {
    this.revision++;
    this.setState(this.state.applyServer(this, operation));
  }
  serverAck() {
    this.revision++;
    this.setState(this.state.serverAck(this));
  }
  serverReconnect() {
    if (typeof this.state.resend === 'function') {
      this.state.resend(this);
    }
  }
  /**
   * 子类必须覆盖applyOperation行为，将服务器数据附加到编辑器上我们这里就是EditorClient类
   * @param {*} operation 
   */
  applyOperation(operation) {
    throw new Error("applyOperation must be defined in child class");
  };
}
Client.Synchronized = Synchronized;
Client.AwaitingConfirm = AwaitingConfirm;
Client.AwaitingWithBuffer = AwaitingWithBuffer;

export default Client;