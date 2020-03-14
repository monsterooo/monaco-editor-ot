import Client from './Client';
import WrappedOperation from './WrappedOperation';
import UndoManager from './UndoManager';
import TextOperation from './TextOperation';
import OtherClient from './OtherClient';

class EditorClient extends Client {
  /**
   * @param {*} revision 版本号 operations.length
   * @param {*} clients  用户数据
   * @param {*} serverAdapter SocketIOAdapter 实例对象
   * @param {*} editorAdapter  MonacoAdapter 实例对象
   */
  constructor(revision, clients, serverAdapter, editorAdapter) {
    super(revision);
    this.serverAdapter = serverAdapter;
    this.editorAdapter = editorAdapter;
    this.undoManager = new UndoManager();
    this.initializeClient(clients);
    this.editorAdapter.registerCallbacks({
      change: (operation, inverse) => {
        this.onChange(operation, inverse);
      },
      selectionChange: (selectionData) => {
        this.onSelectionChange(selectionData);
      }
    });
    this.serverAdapter.registerCallbacks({
      operation: operation => {
        this.applyServer(TextOperation.fromJSON(operation));
      },
      selection: (clientId, selection) => {
        if (selection) {
          this.getClientObject(clientId).updateSelection(
            selection
          );
        }
      },
      ack: () => {
        this.serverAck();
      }
    })
  }
  onChange(textOperation, inverse) {
    const operation = new WrappedOperation(textOperation);
    // TODO 撤销
    this.applyClient(textOperation);
  }
  /**
   * 从Synchronized过来的发送操作，它又去调用服务器适配器发送操作
   */
  sendOperation(revision, operation) {
    this.serverAdapter.sendOperation(revision, operation.toJSON(), this.selection);
  }
  applyOperation(operation) {
    // 现将数据附加到编辑器
    this.editorAdapter.applyOperation(operation);
    // TODO 完成后需要更新选区
    // TODO 需要更新undoManager
  };
  onSelectionChange(selectionData) {
    this.sendSelection(selectionData);
  }
  sendSelection(selectionData) {
    // 如果是正在等待服务器确认中则返回
    if (this.state instanceof Client.AwaitingWithBuffer) {
      return;
    }
    this.serverAdapter.sendSelection(selectionData);
  }
  /**
   * 初始化客户端用户
   */
  initializeClient(clients) {
    this.clients = {};
    for (let clientId in clients) {
      this.addClient(clientId, clients[clientId]);
    }
  }
  addClient(clientId, clientObj) {
    this.clients[clientId] = new OtherClient(clientId, this.editorAdapter, clientObj.name);
  }
  getClientObject(clientId) {
    const client = this.clients[clientId];
    if (client) return client;
    return this.clients[clientId] = new OtherClient(
      clientId,
      this.editorAdapter,
    );
  }
}

export default EditorClient;