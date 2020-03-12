import io from 'socket.io-client';
import MonacoAdapter from './MonacoAdapter';
import EditorClient from './EditorClient';
import SocketIOAdapter from './SocketIOAdapter';

window.loaded.then(() => {
  var monacoIns = monaco.editor.create(document.getElementById('container'), {
    value: ['Monaco Editor Sample'].join('\n'),
    language: 'javascript'
  });
  window.monacoIns = monacoIns;
  const socket = io.connect('127.0.0.1:3000');
  socket.on('doc', obj => {
    const { str, revision, clients } = obj;

    monacoIns.getModel().setValue(str);
    new EditorClient(
      revision,
      clients,
      new SocketIOAdapter(socket),
      new MonacoAdapter(monacoIns)
    );
  })
  
  
});