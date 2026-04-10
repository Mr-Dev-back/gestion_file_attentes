import { createContext } from 'react';
import type { Socket } from 'socket.io-client';
import type { ConnectionState } from '../components/atoms/ui/ConnectionStatus';

export interface SocketContextType {
  socket: Socket | null;
  state: ConnectionState;
}

export const SocketContext = createContext<SocketContextType | undefined>(undefined);
