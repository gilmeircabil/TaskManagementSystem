import { useState } from "react";
import { SocketProvider } from "./context/SocketContext";
import { TaskBoard } from "./components/TaskBoard";

const STORAGE_KEY = "taskflow_username";

function App() {
  const [userName, setUserName] = useState<string | null>(
    () => sessionStorage.getItem(STORAGE_KEY)
  );
  const [nameInput, setNameInput] = useState("");

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const name = nameInput.trim();
    if (!name) return;
    sessionStorage.setItem(STORAGE_KEY, name);
    setUserName(name);
  };

  if (!userName) {
    return (
      <div className="landing">
        <form className="landing-card" onSubmit={handleJoin}>
          <h1>TaskFlow</h1>
          <p>Realtime task management, powered by MERN + Socket.io</p>
          <input
            type="text"
            placeholder="Enter your name to join the board"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            autoFocus
          />
          <button type="submit" className="btn btn-primary">
            Join Board
          </button>
        </form>
      </div>
    );
  }

  return (
    <SocketProvider>
      <TaskBoard userName={userName} />
    </SocketProvider>
  );
}

export default App;
