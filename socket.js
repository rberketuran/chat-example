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
    // Get token from cookies or headers
    const token = socket.handshake.auth.token || socket.handshake.headers.cookie?.split('=')[1];

    // Verify token
    if (!token) {
      return next(new Error('No token provided!'));
    }

    jsonwebtoken.verify(token, process.env.SECRET, (err, decoded) => {
      if (err) {
        return next(new Error('Unauthorized!'));
      }
      socket.userId = decoded.id; // Store user ID in socket for future use
      next();
    });
  });

  io.on('connection', async (socket) => {
    console.log(`User ${socket.userId} connected`);
    let user = await db.get('SELECT * FROM users WHERE id = ?', socket.userId);

    socket.on('chat message', async (msg, user, clientOffset, callback) => {
      let result;
      try {
        result = await db.run('INSERT INTO messages (content, client_offset) VALUES (?, ?)', msg, clientOffset);
      } catch (e) {
        if (e.errno === 19 /* SQLITE_CONSTRAINT */) {
          callback();
        } else {
          // nothing to do, just let the client retry
        }
        return;
      }
      io.emit('chat message', msg, user, result.lastID);
      callback();
    });

    if (!socket.recovered) {
      try {
        await db.each('SELECT id, content FROM messages WHERE id > ?',
          [socket.handshake.auth.serverOffset || 0],
          (_err, row) => {
            socket.emit('chat message', row.content, row.id);
          }
        )
      } catch (e) {
        // something went wrong
      }
    }
  });
};

export default setupSocketIO;
