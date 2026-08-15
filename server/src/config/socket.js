import { Server } from 'socket.io';

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);
    
    socket.on('join_scenario', (scenarioId) => {
      socket.join(scenarioId);
      console.log(`Socket ${socket.id} joined scenario ${scenarioId}`);
    });
    
    socket.on('leave_scenario', (scenarioId) => {
      socket.leave(scenarioId);
      console.log(`Socket ${socket.id} left scenario ${scenarioId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    console.warn('Socket.io not initialized yet');
  }
  return io;
};
