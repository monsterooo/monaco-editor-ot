import Client from './Client';
import WrappedOperation from './WrappedOperation';
import UndoManager from './UndoManager';
import TextOperation from './TextOperation';

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

    this.editorAdapter.registerCallbacks({
      change: (operation, inverse) => {
        this.onChange(operation, inverse);
      }
    });
    this.serverAdapter.registerCallbacks({
      operation: operation => {
        this.applyServer(TextOperation.fromJSON(operation));
      }
    })
  }
  onChange(textOperation, inverse) {
    console.log('EditorClient onChange', operation, inverse)
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
}

export default EditorClient;