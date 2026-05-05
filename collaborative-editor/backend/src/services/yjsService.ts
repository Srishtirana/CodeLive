import { Server } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import * as Y from 'yjs';
import File from '../models/File';

export function setupYjsWebSocket(server: Server) {
  const wss = new WebSocketServer({ 
    server,
    path: '/yjs'
  });

  const docs = new Map<string, Y.Doc>();

  wss.on('connection', (ws: WebSocket, req) => {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const docName = url.searchParams.get('doc');
    
    if (!docName) {
      ws.close(1003, 'Document name required');
      return;
    }

    let doc = docs.get(docName);
    if (!doc) {
      doc = new Y.Doc();
      docs.set(docName, doc);
    }

    const syncHandler = (update: Uint8Array, origin: any) => {
      if (origin !== ws) {
        ws.send(update);
      }
    };

    doc.on('update', syncHandler);

    ws.on('message', async (message) => {
      try {
        const data = message.toString();
        
        if (data.startsWith('{')) {
          const jsonData = JSON.parse(data);
          
          if (jsonData.type === 'save_document' && doc) {
            const content = doc.getText('monaco').toString();
            
            await File.findOneAndUpdate(
              { yjsDocId: docName },
              { 
                content,
                lastModifiedBy: jsonData.userId,
                updatedAt: new Date()
              }
            );
          }
        } else {
          Y.applyUpdate(doc, new Uint8Array(message as any));
        }
      } catch (error) {
        console.error('Error processing message:', error);
      }
    });

    ws.on('close', () => {
      doc?.off('update', syncHandler);
    });

    ws.send(Y.encodeStateAsUpdate(doc));
  });

  console.log('Yjs WebSocket server running on /yjs');
}
