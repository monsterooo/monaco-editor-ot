
class SocketIOAdapter {
  constructor(socket) {
    this.socket = socket;
    // client与socket事件交互适配类
    socket
      .on('ack', () => this.trigger('ack'))
      .on('operation', (clientId, operation, selection) => {
        this.trigger('operation', operation);
        this.trigger('selection', clientId, selection);
      })
      .on('selection', (clientId, selection) => {
        this.trigger('selection', clientId, selection);
      })
      .on('reconnect', () => {
        console.log('receive reconnect event');
      });
  }
  /**
   * 将封装好的opertions传递给socket服务器
   * @param {*} revision 
   * @param {*} operation 
   * @param {*} selection 
   */
  sendOperation(revision, operation, selection) {
    this.socket.emit('operation', revision, operation, selection);
  }
  /**
   * 触发当前对象注册的回调事件
   * @param {*} eventName 注册给当前对象的事件名称
   * @param  {...any} args 传递给事件回调参数
   */
  trigger(eventName, ...args) {
    const action = this.callbacks && this.callbacks[eventName];
    action && action.apply(this, args);
  }
  /**
   * 注册回调函数
   * @param {object} cb 一个对象key是事件名称value是事件名称对应的回调
   */
  registerCallbacks(cb) {
    this.callbacks = cb;
  }
}

export default SocketIOAdapter;