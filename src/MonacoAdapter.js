import TextOperation from './TextOperation';
import { lineAndColumnToIndex } from './utils/monaco-index-converter';
import getSelection from './utils/get-selection';

class MonacoAdapter {
  constructor(monacoIns) {
    this.callbacks = null;
    this.monacoIns = monacoIns;
    this.ignoreNextChange = false;
    this.previousValue = getValue(monacoIns);
    
    monacoIns.onDidChangeModelContent(event => {
      if (!this.ignoreNextChange) {
        let pair = null;
        try {
          pair = this.operationFromMonacoChange(event, this.monacoIns);
        } catch (err) {
          console.log('出错数据')
          console.log(event, this.previousValue);
          throw err;
        }
        this.previousValue = pair[1];
        this.trigger('change', pair[0]);
      }
      this.changeInProgress = false;
      this.ignoreNextChange = false;
    });
    /**
     * https://microsoft.github.io/monaco-editor/api/enums/monaco.editor.cursorchangereason.html
     */
    monacoIns.onDidChangeCursorSelection(event => {
      const { selection } = event;
      const model = monacoIns.getModel();
      const linesContent = model.getLinesContent() || [];
      const selectionData = getSelection(linesContent, selection);
      
      this.trigger('selectionChange', selectionData);
    });
    monacoIns.onDidBlurEditorText(() => {
      this.trigger('blur');
    })
  }
  /**
   * 将编辑器操作封装成operation
   * @param {*} event 编辑器change事件
   * event.change.rangeLength 被替换范围的长度,
   * 这里跟其他编辑器不太一样当你输入一个字母弹出提示然后回车，
   * 这里的rangeLength就是那个输入的字母，
   * 然后event.change.text为回车的提示文本
   * @param {*} monacoIns 编辑器实例
   */
  operationFromMonacoChange(event, monacoIns) {
    const monacoValue = this.previousValue;
    let composeCode = monacoValue;
    let operation = null;

    for(let i = 0; i < event.changes.length; i++) {
      const newOt = new TextOperation();
      const change = event.changes[i];
      const cursorStartOffset = lineAndColumnToIndex(
        monacoValue.split(/\n/),
        change.range.startLineNumber,
        change.range.startColumn
      );
      
      const retain = cursorStartOffset - newOt.targetLength; // 当前保持位置长度

      // 下面将编辑器操作转换成operation
      if (retain !== 0) {
        newOt.retain(retain);
      }
      if (change.rangeLength > 0) {
        // 根据上面所说我们要删除输入被只能提示覆盖的字母
        newOt.delete(change.rangeLength);
      }
      if (change.text) {
        newOt.insert(change.text);
      }
      // 当前编辑内容长度 - operation的
      const remaining = composeCode.length - newOt.baseLength;
      if (remaining > 0) {
        newOt.retain(remaining);
      }
      operation = operation ? operation.compose(newOt) : newOt;
      composeCode = operation.apply(monacoValue)
    }
    return [operation, composeCode];
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
  applyOperation(operation) {
    // 因为是服务器过来的operation操作编辑器
    // 所以这里我们要忽略下一次编辑器的修改
    this.ignoreNextChange = true;
    this.applyOperationToMonaco(operation);
  }
  applyOperationToMonaco(operation) {
    const { ops } = operation;
    const model = this.monacoIns.getModel();
    let index = 0;
    for(let i = 0; i < ops.length; i++) {
      const op = ops[i];
      // 如果某个操作是保留则我们的索引保持跟进
      if (TextOperation.isRetain(op)) {
        index += op;
      } else if (TextOperation.isInsert(op)) {
        // 某个操作是插入我们替换编辑器的内容
        const insert = model.getPositionAt(index);
        model.pushEditOperations(
          this.monacoIns.getSelections(),
          [{
            forceMoveMarkers: true,
            range: new monaco.Range(
              insert.lineNumber,
              insert.column,
              insert.lineNumber,
              insert.column
            ),
            text: op,
          }],
          () => null
        )
        index += op.length; // 据需跟进我们的索引
      } else if (TextOperation.isDelete(op)) {
        const start = model.getPositionAt(index);
        const end = model.getPositionAt(index - op)

        model.pushEditOperations(
          this.monacoIns.getSelections(),
          [{
            forceMoveMarkers: false,
            range: new monaco.Range(
              start.lineNumber,
              start.column,
              end.lineNumber,
              end.column
            ),
            text: null,
          }],
          () => null
        );
      }
    }
  }
}

export default MonacoAdapter;

function getValue(monacoIns) {
  return monacoIns.getModel().getValue(1) || '';
}