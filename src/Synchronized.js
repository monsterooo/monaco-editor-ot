import AwaitingConfirm from './AwaitingConfirm';

// In the 'Synchronized' state, there is no pending operation that the client
// has sent to the server.
// 没有正在提交并且等待回包的 operation
class Synchronized {
  /**
   * 
   * @param {*} client Client 对象实例
   * @param {*} operation 
   */
  applyClient(client, operation) {
    // When the user makes an edit, send the operation to the server and
    // switch to the 'AwaitingConfirm' state
    // 当用户进行编辑时，将操作发送到服务器并切换到“AwaitingConfirm”状态(有一个 operation 提交了但是等后台确认，本地没有编辑数据)
    client.sendOperation(client.revision, operation);
    return new AwaitingConfirm(operation);
  }
  applyServer(client, operation) {
    // When we receive a new operation from the server, the operation can be
    // simply applied to the current document
    // 当我们从服务端接收到一个新的operation时这个operation能够被应用到当前文档
    client.applyOperation(operation);
    return this;
  }
  serverAck(client) {
    throw new Error('There is no pending operation.');
  }
  // 不需要执行任何操作，因为最新的服务器状态和客户机状态是相同的
  transformSelection(x) {
    return x;
  }
}

export default Synchronized;