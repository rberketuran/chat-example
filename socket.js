import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/cluster-adapter';
import jsonwebtoken from 'jsonwebtoken';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';

const setupSocketIO = async (server) => {
  const io = new Server(server, {
    connectionStateRecovery: {},
    adapter: createAdapter()
  });

  const db = await open({
    filename: 'chat.db',
    driver: sqlite3.Database
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.cookie?.split('=')[1];

    if (!token) {
      return next(new Error('No token provided!'));
    }

    jsonwebtoken.verify(token, process.env.SECRET, (err, decoded) => {
      if (err) {
        return next(new Error('Unauthorized!'));
      }
      socket.userId = decoded.id;
      next();
    });
  });

  io.on('connection', async (socket) => {
    socket.user = await db.get('SELECT * FROM users WHERE id = ?', socket.userId);

    socket.on('chat message', async (msg, clientOffset, callback) => {
      let result;
      try {
        result = await db.run('INSERT INTO messages (content, client_offset) VALUES (?, ?)', msg, clientOffset);
      } catch (e) {
        if (e.errno === 19) {
          if (callback) callback();
        } else {
          // nothing to do, just let the client retry
        }
        return;
      }
      io.emit('chat message', { msg, username: socket.user.username }, result.lastID);
      if (callback) callback();
    });

    if (!socket.recovered) {
      try {
        await db.each('SELECT id, content FROM messages WHERE id > ?',
          [socket.handshake.auth.serverOffset || 0],
          (_err, row) => {
            socket.emit('chat message', { msg: row.content, username: socket.user.username }, row.id);
          }
        )
      } catch (e) {
        // something went wrong
      }
    }
  });
};

export default setupSocketIO;
