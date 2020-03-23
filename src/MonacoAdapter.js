import TextOperation from './TextOperation';
import { lineAndColumnToIndex } from './utils/monaco-index-converter';
import getSelection from './utils/get-selection';

class MonacoAdapter {
  constructor(monacoIns) {
    this.callbacks = null;
    this.monacoIns = monacoIns;
    this.ignoreNextChange = false;
    this.liveOperationCode = getValue(monacoIns);
    
    monacoIns.onDidChangeModelContent(event => {
      if (!this.ignoreNextChange) {
        try {
          const pair = this.operationFromMonacoChange(event, this.monacoIns);
          this.trigger('change', pair);
        } catch (err) {
          console.log('错误信息', err);
          throw err;
        }
      }
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
  operationFromMonacoChange(event) {
    let composedCode = this.liveOperationCode;
    let operation;

    for(let i = 0; i < event.changes.length; i++) {
      const change = event.changes[i];
      const cursorStartOffset = lineAndColumnToIndex(
        composedCode.split(/\n/),
        change.range.startLineNumber,
        change.range.startColumn
      );
      const {
        rangeLength, // 删除或替换长度
        text, // 增加文本
      } = change;
      const newOt = new TextOperation();

      newOt.retain(cursorStartOffset);
      if (rangeLength > 0) {
        newOt.delete(rangeLength);
      }
      if (text) {
        newOt.insert(text);
      }
      const remaining = composedCode.length - newOt.baseLength;
      if (remaining > 0) {
        newOt.retain(remaining);
      }
      operation = operation ? operation.compose(newOt) : newOt;
      composedCode = operation.apply(this.liveOperationCode);
    }
    this.liveOperationCode = composedCode;
    return operation;
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
    this.ignoreNextChange = false;
  }
  applyOperationToMonaco(operation, pushStack = false) {
    const { ops } = operation;
    const model = this.monacoIns.getModel();
    let index = 0;
    const results = [];

    for(let i = 0; i < ops.length; i++) {
      const op = ops[i];
      // 如果某个操作是保留则我们的索引保持跟进
      if (TextOperation.isRetain(op)) {
        index += op;
      } else if (TextOperation.isInsert(op)) {
        // 某个操作是插入我们替换编辑器的内容
        const insert = model.getPositionAt(index);
        results.push({
          forceMoveMarkers: true,
          range: new monaco.Range(
            insert.lineNumber,
            insert.column,
            insert.lineNumber,
            insert.column
          ),
          text: op,
        });
      } else if (TextOperation.isDelete(op)) {
        const start = model.getPositionAt(index);
        const end = model.getPositionAt(index - op)

        results.push({
          forceMoveMarkers: false,
          range: new monaco.Range(
            start.lineNumber,
            start.column,
            end.lineNumber,
            end.column
          ),
          text: null,
        });
        index -= op;
      }
    }
    if (pushStack) {
      model.pushEditOperations([], results);
    } else {
      model.applyEdits(results);
    }
  }
}

export default MonacoAdapter;

function getValue(monacoIns) {
  return monacoIns.getModel().getValue(1) || '';
}