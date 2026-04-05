import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import "../css/Chat.css";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { MdGroupAdd } from "react-icons/md";
import { FaSearch, FaEllipsisV } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const socket = io("http://localhost:5000");

const ChatPage = () => {
  const [activeTab, setActiveTab] = useState("Chat");
  const [showGroupMenu, setShowGroupMenu] = useState(false);
  const [showCreateGroupForm, setShowCreateGroupForm] = useState(false);
  const [isPlanningGroup, setIsPlanningGroup] = useState(false);

  const [chats, setChats] = useState([]);
  const [unreadChats, setUnreadChats] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Group Form States
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [groupPhoto, setGroupPhoto] = useState(null);
  const [planningDate, setPlanningDate] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);

  const messageEndRef = useRef(null);
  const token = localStorage.getItem("token");
  const [currentUserId, setCurrentUserId] = useState(null);
  const [activeMessageMenu, setActiveMessageMenu] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editedText, setEditedText] = useState("");
  const navigate = useNavigate();
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [editingGroup, setEditingGroup] = useState(false);

  // Decode JWT to get current user ID
  useEffect(() => {
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setCurrentUserId(payload.id);
      } catch (err) {
        console.error("Failed to decode token", err);
      }
    }
  }, [token]);

  // ================== FETCH DATA ==================
  const fetchChats = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/chat", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setChats(data);
    } catch (err) {
      console.error("Error fetching chats:", err);
    }
  };

  const fetchUnread = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/chat/unread", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setUnreadChats(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/chat/requests", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setPendingRequests(data);
    } catch (err) {
      console.error("Error fetching requests:", err);
    }
  };

  // Load data when tab changes
  useEffect(() => {
    if (!token) return;
    if (activeTab === "Chat") fetchChats();
    if (activeTab === "Unread") fetchUnread();
    if (activeTab === "Request") fetchRequests();
  }, [activeTab, token]);

  // ================== SOCKET.IO ==================
  // useEffect(() => {
  //   socket.on("receiveMessage", (msg) => {
  //     if (selectedChat && msg.chat === selectedChat._id) {
  //       setMessages((prev) => [...prev, msg]);
  //     }
  //     fetchChats(); // Refresh sidebar
  //   });

  //   return () => socket.off("receiveMessage");
  // }, [selectedChat]);

  // ================== SEARCH ==================
  const handleSearch = async (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await fetch(`http://localhost:5000/api/chat/search?q=${q}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const users = await res.json();
      setSearchResults(users);
    } catch (err) {
      console.error(err);
    }
  };

  // ================== SEND CHAT REQUEST ==================
  const sendChatRequest = async (toUserId) => {
    if (!toUserId || !token) return;

    try {
      const res = await fetch("http://localhost:5000/api/chat/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ to: toUserId }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("✅ Chat request sent successfully!");
        setSearchQuery("");
        setSearchResults([]);
      } else {
        alert(data.message || "Failed to send request");
      }
    } catch (err) {
      console.error(err);
      alert("Network error while sending request");
    }
  };

  // ================== OPEN CHAT ==================
  const openChat = async (chat) => {
    setSelectedChat(chat);
    setActiveTab("Chat");

    try {
      const res = await fetch(
        `http://localhost:5000/api/chat/${chat._id}/messages`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const msgs = await res.json();
      setMessages(msgs);
      socket.emit("joinChat", chat._id);
    } catch (err) {
      console.error(err);
    }
  };

  // ================== SEND MESSAGE ==================
  // ================== SEND MESSAGE ==================
  const sendMessage = () => {
    if (!newMessage.trim() || !selectedChat || !currentUserId) return;

    const messageText = newMessage.trim();

    // Create optimistic message (temporary message)
    const optimisticMessage = {
      _id: `temp-${Date.now()}`, // temporary ID
      chat: selectedChat._id,
      sender: currentUserId,
      text: messageText,
      createdAt: new Date().toISOString(),
      isMine: true, // optional flag
    };

    // Add to UI immediately (Optimistic Update)
    setMessages((prev) => [...prev, optimisticMessage]);

    // Send to server via socket
    socket.emit("sendMessage", {
      chatId: selectedChat._id,
      senderId: currentUserId,
      text: messageText,
    });

    setNewMessage(""); // Clear input
  };

  // ================== REQUEST ACTIONS ==================
  const handleRequestAction = async (requestId, status) => {
    try {
      await fetch(`http://localhost:5000/api/chat/request/${requestId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      alert(`Request ${status} successfully`);
      fetchRequests();
      fetchChats(); // Refresh if accepted
    } catch (err) {
      alert("Action failed");
    }
  };

  // ================== CREATE GROUP ==================
  const createGroup = async () => {
    if (!groupName) return alert("Group name is required");

    const formData = new FormData();
    formData.append("name", groupName);
    formData.append("description", groupDescription);
    formData.append("type", isPlanningGroup ? "planning" : "normal");
    if (isPlanningGroup && planningDate)
      formData.append("planningDate", planningDate);
    if (groupPhoto) formData.append("photo", groupPhoto);
    formData.append("members", JSON.stringify(selectedMembers));

    try {
      const res = await fetch("http://localhost:5000/api/chat/group", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        alert("Group created successfully!");
        setShowCreateGroupForm(false);
        resetGroupForm();
        fetchChats();
      } else {
        alert("Failed to create group");
      }
    } catch (err) {
      alert("Error creating group");
    }
  };

  const resetGroupForm = () => {
    setGroupName("");
    setGroupDescription("");
    setPlanningDate("");
    setGroupPhoto(null);
    setSelectedMembers([]);
  };

  const handleEditMessage = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/chat/message/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: editedText }),
      });

      const updated = await res.json();

      setMessages((prev) =>
        prev.map((m) =>
          m._id === id
            ? { ...m, text: updated.text } // ✅ keep old sender
            : m,
        ),
      );

      socket.emit("messageEdited", {
        ...updated,
        chat: selectedChat._id,
      });
      setEditingMessageId(null);
      setEditedText("");
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteMessage = async (id) => {
    try {
      await fetch(`http://localhost:5000/api/chat/message/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // local update
      setMessages((prev) =>
        prev.map((m) =>
          m._id === id ? { ...m, text: "This message was unsent" } : m,
        ),
      );

      // emit socket
      socket.emit("messageDeleted", { messageId: id });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    socket.on("receiveMessage", (msg) => {
      if (!selectedChat || msg.chat !== selectedChat._id) return;

      // Prevent duplicate (if server echoes back our own message)
      setMessages((prev) => {
        const alreadyExists = prev.some(
          (m) =>
            m._id === msg._id ||
            (m._id.startsWith("temp-") && m.text === msg.text),
        );
        if (alreadyExists) return prev;

        return [...prev, msg];
      });

      fetchChats(); // Refresh sidebar
    });

    // Keep your edit and delete listeners as they are
    socket.on("messageEdited", (updatedMsg) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === updatedMsg._id ? updatedMsg : m)),
      );
    });

    socket.on("messageDeleted", ({ messageId }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId
            ? { ...m, text: "This message was unsent", isDeleted: true }
            : m,
        ),
      );
    });

    return () => {
      socket.off("receiveMessage");
      socket.off("messageEdited");
      socket.off("messageDeleted");
    };
  }, [selectedChat]);

  // Auto scroll to latest message
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <>
      <Navbar />
      <div className="chat-page">
        <div className="chat-container">
          {/* LEFT SIDEBAR */}
          <div className="sidebar">
            <div className="tabs">
              <button
                className={activeTab === "Chat" ? "active" : ""}
                onClick={() => setActiveTab("Chat")}
              >
                Chat
              </button>
              <button
                className={activeTab === "Search" ? "active" : ""}
                onClick={() => setActiveTab("Search")}
              >
                Search
              </button>
              <button
                className={activeTab === "Request" ? "active" : ""}
                onClick={() => setActiveTab("Request")}
              >
                Request{" "}
                {pendingRequests.length > 0 && (
                  <span className="red-dot">*</span>
                )}
              </button>
              <button
                className={activeTab === "Unread" ? "active" : ""}
                onClick={() => setActiveTab("Unread")}
              >
                Unread
              </button>

              <button
                onClick={() => setShowGroupMenu(!showGroupMenu)}
                title="Create Group"
              >
                <MdGroupAdd size={24} />
              </button>

              {showGroupMenu && (
                <div className="group-menu">
                  <button
                    onClick={() => {
                      setIsPlanningGroup(false);
                      setShowGroupMenu(false);
                      setShowCreateGroupForm(true);
                    }}
                  >
                    Normal Group Chat
                  </button>
                  <button
                    onClick={() => {
                      setIsPlanningGroup(true);
                      setShowGroupMenu(false);
                      setShowCreateGroupForm(true);
                    }}
                  >
                    Planning Group Chat
                  </button>
                </div>
              )}
            </div>

            {/* Search Tab */}
            {activeTab === "Search" && (
              <div className="search-wrapper">
                <div className="search-box">
                  <FaSearch className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search trekkers..."
                    value={searchQuery}
                    onChange={handleSearch}
                  />
                </div>
                <div className="search-results">
                  {searchResults.map((user) => (
                    <div key={user._id} className="user-item">
                      <img
                        src={
                          user.profilePic
                            ? `http://localhost:5000${user.profilePic}`
                            : "https://via.placeholder.com/42"
                        }
                        alt={user.name}
                        className="avatar small"
                      />
                      <div style={{ flex: 1 }}>
                        <h4>{user.name}</h4>
                        <p>{user.email}</p>
                      </div>
                      <button
                        onClick={() => sendChatRequest(user._id)}
                        style={{
                          background: "#4caf50",
                          color: "white",
                          border: "none",
                          padding: "8px 12px",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "13px",
                        }}
                      >
                        Send Request
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Chat / Unread List */}
            <div className="user-list">
              {(activeTab === "Chat"
                ? chats
                : activeTab === "Unread"
                  ? unreadChats
                  : []
              ).map((chat) => {
                const otherUser = !chat.isGroup
                  ? chat.participants?.find((p) => p._id !== currentUserId)
                  : null;

                return (
                  <div
                    key={chat._id}
                    className={`user-item ${selectedChat?._id === chat._id ? "active" : ""}`}
                    onClick={() => openChat(chat)}
                  >
                    <img
                      src={
                        chat.isGroup
                          ? chat.photo
                            ? `http://localhost:5000${chat.photo}`
                            : "https://via.placeholder.com/42?text=Group"
                          : otherUser?.profilePic
                            ? `http://localhost:5000${otherUser.profilePic}`
                            : "https://via.placeholder.com/42"
                      }
                      alt=""
                      className="avatar small"
                    />
                    <div>
                      <h4>
                        {chat.isGroup
                          ? chat.name
                          : otherUser?.name || "Unknown User"}
                      </h4>
                      <p>
                        {chat.lastMessage
                          ? chat.lastMessage.text.substring(0, 30) + "..."
                          : "No messages yet"}
                        {chat.unreadCount > 0 && (
                          <span className="unread-count">
                            {" "}
                            ({chat.unreadCount})
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                );
              })}

              {/* REQUEST TAB */}
              {activeTab === "Request" &&
                pendingRequests.map((req) => (
                  <div key={req._id} className="user-item">
                    <img
                      src={
                        req.from?.profilePic
                          ? `http://localhost:5000${req.from.profilePic}`
                          : "https://via.placeholder.com/42"
                      }
                      alt={req.from?.name}
                      className="avatar small"
                    />
                    <div style={{ flex: 1 }}>
                      <h4>
                        {req.type === "group"
                          ? `Group Invite: ${req.chat?.name}`
                          : req.from?.name}
                      </h4>

                      <p>
                        {req.type === "group"
                          ? "invited you to join a group"
                          : "sent you a chat request"}
                      </p>
                    </div>
                    <div>
                      <button
                        onClick={() => handleRequestAction(req._id, "accepted")}
                        style={{
                          marginRight: "5px",
                          background: "#4caf50",
                          color: "white",
                          border: "none",
                          padding: "6px 10px",
                          borderRadius: "6px",
                        }}
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleRequestAction(req._id, "rejected")}
                        style={{
                          background: "#e74c3c",
                          color: "white",
                          border: "none",
                          padding: "6px 10px",
                          borderRadius: "6px",
                        }}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* RIGHT CHAT AREA */}
          <div className="chat-area">
            {showCreateGroupForm ? (
              <div className="create-group-form">
                {/* TYPE SWITCH */}
                <div className="group-type-toggle">
                  <button
                    className={!isPlanningGroup ? "active" : ""}
                    onClick={() => setIsPlanningGroup(false)}
                  >
                    Normal
                  </button>
                  <button
                    className={isPlanningGroup ? "active" : ""}
                    onClick={() => setIsPlanningGroup(true)}
                  >
                    Planning
                  </button>
                </div>

                {/* IMAGE */}
                <div className="group-avatar-upload">
                  <input
                    type="file"
                    onChange={(e) => setGroupPhoto(e.target.files[0])}
                  />
                </div>

                {/* NAME */}
                <input
                  type="text"
                  placeholder="Group Name"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                />

                {/* DESCRIPTION */}
                <textarea
                  placeholder="Group Description"
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                />

                {/* PLANNING FIELDS */}
                {isPlanningGroup && (
                  <>
                    <input placeholder="Planning Location" />
                    <input
                      type="datetime-local"
                      value={planningDate}
                      onChange={(e) => setPlanningDate(e.target.value)}
                    />
                  </>
                )}

                {/* USER SEARCH */}
                <div className="user-search-box">
                  <FaSearch />
                  <input
                    type="text"
                    placeholder="Search users..."
                    onChange={handleSearch}
                  />
                </div>

                {/* USER LIST */}
                <div className="user-list-scroll">
                  {searchResults.map((user) => (
                    <div key={user._id} className="user-item-small">
                      <span>{user.name}</span>
                      <button
                        className="add-user-btn"
                        onClick={() =>
                          setSelectedMembers((prev) => [...prev, user._id])
                        }
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>

                {/* ACTIONS */}
                <button onClick={createGroup}>Create Group</button>
              </div>
            ) : selectedChat ? (
              <>
                <div className="chat-header">
                  <div className="header-left">
                    <img
                      src={
                        selectedChat.isGroup
                          ? selectedChat.photo
                            ? `http://localhost:5000${selectedChat.photo}`
                            : "https://via.placeholder.com/52?text=Group"
                          : (() => {
                              const user = selectedChat.participants?.find(
                                (p) => p._id !== currentUserId,
                              );
                              return user?.profilePic
                                ? `http://localhost:5000${user.profilePic}`
                                : "https://via.placeholder.com/52";
                            })()
                      }
                      alt=""
                      className="avatar large"
                    />
                    <h2>
                      {selectedChat.isGroup
                        ? selectedChat.name
                        : selectedChat.participants?.find(
                            (p) => p._id !== currentUserId,
                          )?.name}
                    </h2>
                  </div>
                  <FaEllipsisV
                    className="menu-icon"
                    onClick={() => setShowHeaderMenu(!showHeaderMenu)}
                  />

                  {showHeaderMenu && (
                    <div className="header-menu">
                      {/* PRIVATE CHAT */}
                      {!selectedChat.isGroup && (
                        <button
                          onClick={() => {
                            const user = selectedChat.participants.find(
                              (p) => p._id !== currentUserId,
                            );
                            navigate(`/profile/${user._id}`);
                          }}
                        >
                          View Profile
                        </button>
                      )}

                      {/* GROUP CHAT */}
                      {selectedChat.isGroup && (
                        <>
                          <p>
                            <strong>Description:</strong>{" "}
                            {selectedChat.description}
                          </p>

                          {selectedChat.admin === currentUserId && (
                            <button onClick={() => setEditingGroup(true)}>
                              Edit Group
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="chat-body">
                  {messages.map((msg, i) => {
                    const isMine =
                      msg.sender?._id === currentUserId ||
                      msg.sender === currentUserId ||
                      msg.isMine === true; // for optimistic messages

                    const isUnsent = 
  msg.isDeleted === true || 
  msg.text === "This message was unsent" ||
  (msg.text && msg.text.trim() === "This message was unsent");

                    const senderPic = msg.sender?.profilePic
                      ? `http://localhost:5000${msg.sender.profilePic}`
                      : "https://via.placeholder.com/36";

                    return (
                      <div
                        key={msg._id || i}
                        className={`message ${isMine ? "right" : "left"}`}
                      >
                        {!isMine && (
                          <img
                            src={senderPic}
                            alt="avatar"
                            className="message-avatar"
                          />
                        )}

                        {/* 3-Dot Menu - Only show for MY messages that are NOT unsent */}
                        {isMine && !isUnsent && (
                          <div className="msg-menu-wrapper">
                            <FaEllipsisV
                              className="msg-menu-icon"
                              onClick={() =>
                                setActiveMessageMenu(
                                  activeMessageMenu === msg._id
                                    ? null
                                    : msg._id,
                                )
                              }
                            />
                            {activeMessageMenu === msg._id && (
                              <div className="msg-menu">
                                <button
                                  onClick={() => {
                                    setEditingMessageId(msg._id);
                                    setEditedText(msg.text);
                                    setActiveMessageMenu(null);
                                  }}
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteMessage(msg._id)}
                                >
                                  Unsend
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Message Content */}
                        <div className="message-content">
                          {editingMessageId === msg._id ? (
                            <>
                              <input
                                value={editedText}
                                onChange={(e) => setEditedText(e.target.value)}
                              />
                              <button
                                onClick={() => handleEditMessage(msg._id)}
                              >
                                Save
                              </button>
                            </>
                          ) : (
                            <div
                              className={`bubble ${isUnsent ? "unsent" : ""}`}
                            >
                              {msg.text}
                            </div>
                          )}

                          <span className="time">
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="chat-input">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="Write your message..."
                  />
                  <button onClick={sendMessage}>➤</button>
                </div>
              </>
            ) : (
              <div className="no-chat-selected">
                <h3>Select a chat or create a new group</h3>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default ChatPage;
