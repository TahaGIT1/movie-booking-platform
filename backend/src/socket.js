import { Server } from 'socket.io';

let ioInstance = null;

export const initSocket = (httpServer) => {
  ioInstance = new Server(httpServer, {
    cors: {
      origin: '*',
    },
  });

  ioInstance.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    socket.on('join_show', (showId) => {
      socket.join(`show:${showId}`);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected:', socket.id);
    });
  });

  return ioInstance;
};

export const io = {
  to: (room) => {
    if (ioInstance) return ioInstance.to(room);
    return { emit: () => {} };
  },
  emit: (event, data) => {
    if (ioInstance) return ioInstance.emit(event, data);
  }
};
