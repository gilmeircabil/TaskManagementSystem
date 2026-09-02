import { useEffect, useState } from "react";
import { useSocket } from "../context/SocketContext";
import { OnlineUser, SOCKET_EVENTS } from "../types/task";

interface HeaderProps {
  userName: string;
  onAddTask: () => void;
}

export const Header = ({ userName, onAddTask }: HeaderProps) => {
  const { socket, connected } = useSocket();
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);

  useEffect(() => {
    if (!socket) return;

    if (connected) socket.emit("presence:join", userName);

    const onPresence = (users: OnlineUser[]) => setOnlineUsers(users);
    socket.on(SOCKET_EVENTS.PRESENCE_UPDATE, onPresence);

    return () => {
      socket.off(SOCKET_EVENTS.PRESENCE_UPDATE, onPresence);
    };
  }, [socket, connected, userName]);

  return (
    <header className="header">
      <div className="header-left">
        <h1>TaskFlow</h1>
        <span className={`status-dot ${connected ? "online" : "offline"}`} />
        <span className="status-text">{connected ? "Live" : "Reconnecting…"}</span>
      </div>

      <div className="header-right">
        <div className="presence-stack" title={onlineUsers.map((u) => u.name).join(", ")}>
          {onlineUsers.slice(0, 5).map((u) => (
            <span key={u.socketId} className="avatar" style={{ background: colorFromString(u.name) }}>
              {u.name.slice(0, 1).toUpperCase()}
            </span>
          ))}
          {onlineUsers.length > 0 && (
            <span className="presence-count">{onlineUsers.length} online</span>
          )}
        </div>
        <button className="btn btn-primary" onClick={onAddTask}>
          + New Task
        </button>
      </div>
    </header>
  );
};

function colorFromString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 65%, 45%)`;
}
