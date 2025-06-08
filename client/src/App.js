import React, { useState, useEffect, useRef } from "react";

function App() {
  const [pseudo, setPseudo] = useState("");
  const [input, setInput] = useState("");
  const [users, setUsers] = useState([]);
  const [selectedConv, setSelectedConv] = useState("room"); // "room" ou un pseudo
  const [conversations, setConversations] = useState({});
  const [notifications, setNotifications] = useState({});
  const ws = useRef(null);
  const bottomRef = useRef(null);

  // Registration pseudo
  useEffect(() => {
    if (ws.current && pseudo) {
      ws.current.send(`/_register ${pseudo}\n`);
    }
  }, [pseudo]);

  useEffect(() => {
    ws.current = new window.WebSocket("ws://localhost:8080");
    ws.current.onopen = () => {
      if (pseudo) ws.current.send(`/_register ${pseudo}\n`);
      ws.current.send("/_list\n");
    };
    ws.current.onmessage = (event) => {
      const data = event.data;
      if (data.startsWith("USERS:")) {
        const us = data.slice(6).trim().split(" ").filter(Boolean);
        setUsers(us);
      } else if (data.startsWith("USERLIST_CHANGED")) {
        ws.current.send("/_list\n");
      }
      // Message privé reçu
      else if (data.startsWith("(privé de ")) {
        const match = data.match(/^\(privé de ([^)]*)\):(.*)$/s);
        if (match) {
          const from = match[1];
          const text = match[2].trim();
          setConversations((old) => {
            const conv = [...(old[from] || [])];
            conv.push({ fromSelf: false, text });
            return { ...old, [from]: conv };
          });
          setNotifications((old) => {
            if (selectedConv !== from) {
              return { ...old, [from]: (old[from] || 0) + 1 };
            } else {
              return old;
            }
          });
        }
      }
      // Message room reçu
      else if (data.startsWith("(room de ")) {
        const match = data.match(/^\(room de ([^)]*)\):(.*)$/s);
        if (match) {
          const from = match[1];
          const text = match[2].trim();
          setConversations((old) => {
            const conv = [...(old["room"] || [])];
            conv.push({ fromSelf: false, text: `${from}: ${text}` });
            return { ...old, room: conv };
          });
          setNotifications((old) => {
            if (selectedConv !== "room") {
              return { ...old, room: (old["room"] || 0) + 1 };
            } else {
              return old;
            }
          });
        }
      }
    };
    return () => ws.current && ws.current.close();
    // eslint-disable-next-line
  }, [selectedConv]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedConv, conversations]);

  // Reset notif à l'ouverture de la conv
  useEffect(() => {
    if (notifications[selectedConv]) {
      setNotifications((old) => ({ ...old, [selectedConv]: 0 }));
    }
  }, [selectedConv, notifications]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (input && ws.current && ws.current.readyState === 1) {
      let msgToSend = input;
      if (selectedConv === "room") {
        msgToSend = `/room ${input}`;
        setConversations((old) => {
          const conv = [...(old["room"] || [])];
          conv.push({ fromSelf: true, text: input });
          return { ...old, room: conv };
        });
      } else if (selectedConv) {
        msgToSend = `/_to ${selectedConv}: ${input}`;
        setConversations((old) => {
          const conv = [...(old[selectedConv] || [])];
          conv.push({ fromSelf: true, text: input });
          return { ...old, [selectedConv]: conv };
        });
      }
      ws.current.send(msgToSend + "\n");
      setInput("");
    }
  };

  // Historique en cours
  const currentConv = conversations[selectedConv] || [];

  return (
    <div style={{
      display: "flex",
      flexDirection: "row",
      background: "#f7f7fa",
      minHeight: "100vh"
    }}>
      <div style={{
        width: 250,
        background: "#eee",
        padding: 0,
        borderRight: "1px solid #ccc",
        display: "flex",
        flexDirection: "column"
      }}>
        <div style={{
          padding: 16,
          borderBottom: "1px solid #ccc",
          fontWeight: "bold",
          fontSize: 18
        }}>
          <span role="img" aria-label="room">👥</span>{" "}
          <span
            style={{
              cursor: "pointer",
              color: selectedConv === "room" ? "#388e3c" : "#333",
              background: selectedConv === "room" ? "#d0f0ff" : "transparent",
              borderRadius: 8,
              padding: "4px 10px"
            }}
            onClick={() => setSelectedConv("room")}
          >
            Groupe
            {notifications["room"] > 0 && (
              <span style={{
                marginLeft: 8,
                background: "#4caf50",
                color: "#fff",
                borderRadius: "50%",
                minWidth: 22,
                height: 22,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
                fontSize: 14
              }}>
                {notifications["room"]}
              </span>
            )}
          </span>
        </div>
        <div style={{
          padding: "12px 18px",
          borderBottom: "1px solid #ccc",
          fontWeight: 500,
          color: "#888",
          background: "#e9e9ed"
        }}>
          Contacts online
        </div>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {users
            .filter(u => u !== pseudo)
            .map((u) => (
              <li
                key={u}
                style={{
                  position: "relative",
                  padding: "12px 18px",
                  borderBottom: "1px solid #ddd",
                  background: u === selectedConv ? "#d0f0ff" : "#fff",
                  cursor: "pointer"
                }}
                onClick={() => setSelectedConv(u)}
              >
                {u}
                {notifications[u] > 0 && (
                  <span style={{
                    position: "absolute",
                    right: 18,
                    top: 12,
                    background: "#4caf50",
                    color: "#fff",
                    borderRadius: "50%",
                    minWidth: 22,
                    height: 22,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "bold"
                  }}>
                    {notifications[u]}
                  </span>
                )}
              </li>
            ))}
        </ul>
        <div style={{ marginTop: "auto", padding: 16, color: "#888", fontSize: 15 }}>
          <input
            value={pseudo}
            onChange={(e) => setPseudo(e.target.value)}
            placeholder="Votre pseudo"
            style={{
              width: "100%", padding: 8, borderRadius: 6, border: "1px solid #bbb", fontSize: 15
            }}
          />
        </div>
      </div>
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        background: "#f7f7fa"
      }}>
        <div style={{
          padding: "18px 30px 12px 30px",
          borderBottom: "1px solid #ccc",
          background: "#fff",
          fontWeight: "bold",
          fontSize: 22
        }}>
          {selectedConv === "room"
            ? "💬 Groupe"
            : selectedConv
            ? `Discussion avec ${selectedConv}`
            : ""}
        </div>
        <div
          style={{
            flex: 1,
            padding: 30,
            overflowY: "auto",
            background: "#f5f5f9"
          }}
        >
          {currentConv.map((msg, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: msg.fromSelf ? "flex-end" : "flex-start",
                marginBottom: 8
              }}
            >
              <div
                style={{
                  background: msg.fromSelf ? "#DCF8C6" : "#fff",
                  color: "#222",
                  borderRadius: 16,
                  padding: "8px 14px",
                  maxWidth: "65%",
                  boxShadow: msg.fromSelf ? "0 2px 5px #b7e0a3" : "0 1px 2px #ccc"
                }}
              >
                <span style={{ fontSize: 16 }}>{msg.text}</span>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
        <form onSubmit={sendMessage} style={{
          display: "flex", gap: 8, padding: 25, borderTop: "1px solid #ccc", background: "#fff"
        }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={{
              flex: 1,
              padding: 12,
              fontSize: 16,
              borderRadius: 6,
              border: "1px solid #bbb"
            }}
            placeholder={
              selectedConv === "room"
                ? "Message pour le groupe..."
                : selectedConv
                ? `Message privé à ${selectedConv}`
                : ""
            }
          />
          <button
            type="submit"
            style={{
              padding: "10px 24px",
              fontSize: 16,
              borderRadius: 6,
              background: "#388e3c",
              color: "#fff",
              border: "none",
              fontWeight: "bold",
              cursor: "pointer"
            }}
          >Envoyer</button>
        </form>
      </div>
    </div>
  );
}

export default App;