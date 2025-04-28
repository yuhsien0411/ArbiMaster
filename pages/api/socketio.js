import { Server as ServerIO } from 'socket.io';

export default async function handler(req, res) {
  if (res.socket.server.io) {
    console.log('Socket.io 已經運行');
    res.end();
    return;
  }

  console.log('Socket.io 正在初始化...');
  const io = new ServerIO(res.socket.server, {
    path: '/api/socketio',
    addTrailingSlash: false,
    transports: ['polling', 'websocket'],
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  // 保存 io 實例到全局對象
  res.socket.server.io = io;
  global.io = io;

  // 設置連接事件
  io.on('connection', (socket) => {
    console.log(`Socket ${socket.id} 已連接`);

    socket.on('disconnect', () => {
      console.log(`Socket ${socket.id} 已斷開連接`);
    });
  });

  io.on('error', (error) => {
    console.error('Socket.io 錯誤:', error);
  });

  console.log('Socket.io 已成功初始化');
  res.end();
}

export const config = {
  api: {
    bodyParser: false
  }
}; 