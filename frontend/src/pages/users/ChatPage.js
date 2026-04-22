import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import "../css/Chat.css";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { MdGroupAdd } from "react-icons/md";
import { FaSearch, FaEllipsisV } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { IoArrowBack } from "react-icons/io5";

const socket = io("http://localhost:5000", {
  autoConnect: true,
  transports: ["websocket"],
});

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
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [groupParticipants, setGroupParticipants] = useState([]);
  const [isEditingGroup, setIsEditingGroup] = useState(false);
  const [editGroupName, setEditGroupName] = useState("");
  const [editGroupDescription, setEditGroupDescription] = useState("");
  const [editPlanningDate, setEditPlanningDate] = useState("");
  const [editPlanningLocation, setEditPlanningLocation] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [requestCount, setRequestCount] = useState(0);
  const [planningLocation, setPlanningLocation] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [chatStatus, setChatStatus] = useState({});

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

  const scrollToBottom = (behavior = "smooth") => {
    setTimeout(() => {
      messageEndRef.current?.scrollIntoView({
        behavior,
        block: "end",
      });
    }, 100);
  };

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
      setUnreadChats(data || []);

      const totalUnread = data.reduce(
        (sum, chat) => sum + (chat.unreadCount || 0),
        0,
      );
      setUnreadCount(totalUnread);
    } catch (err) {
      console.error("Error fetching unread:", err);
      setUnreadChats([]);
    }
  };
  const fetchRequests = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/chat/requests", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setPendingRequests(data);
      setRequestCount(data.length);
    } catch (err) {
      console.error("Error fetching requests:", err);
    }
  };

  useEffect(() => {
    if (!token) return;
    if (activeTab === "Chat") fetchChats();
    if (activeTab === "Unread") fetchUnread();
    if (activeTab === "Request") fetchRequests();
  }, [activeTab, token]);

  useEffect(() => {
    if (!token) return;
    fetchUnread();
    fetchRequests();
  }, [token]);

  useEffect(() => {
    if (!currentUserId) return;

    socket.emit("joinUser", currentUserId);
  }, [currentUserId]);

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

      users.forEach(async (user) => {
        const statusRes = await fetch(
          `http://localhost:5000/api/chat/chat-status/${user._id}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const status = await statusRes.json();

        setChatStatus((prev) => ({
          ...prev,
          [user._id]: status,
        }));
      });
    } catch (err) {
      console.error(err);
    }
  };

  const headerMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showHeaderMenu &&
        headerMenuRef.current &&
        !headerMenuRef.current.contains(event.target)
      ) {
        setShowHeaderMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showHeaderMenu]);

  const sendChatRequest = async (toUserId) => {
    if (!toUserId || !token) return;

    try {
      const res = await fetch("http://localhost:5000/api/chat/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ to: toUserId, type: "private" }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Private chat request sent successfully!");
        setSearchQuery("");
        setSearchResults([]);
      } else {
        alert(data.message || "Failed to send request");
      }
    } catch (err) {
      console.error(err);
      alert("Network error");
    }
  };

  const openChat = async (chat) => {
    setSelectedChat(chat);
    setActiveTab("Chat");
    setUnreadChats((prev) => prev.filter((c) => c._id !== chat._id));
    setUnreadCount((prev) => Math.max(prev - (chat.unreadCount || 1), 0));
    try {
      const res = await fetch(
        `http://localhost:5000/api/chat/${chat._id}/messages`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const msgs = await res.json();
      setMessages(msgs);
      scrollToBottom("auto");

      socket.emit("joinChat", chat._id);
      socket.emit("markAsRead", { chatId: chat._id });

      await fetch(`http://localhost:5000/api/chat/${chat._id}/read`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });

      fetchChats();
    } catch (err) {
      console.error("Error opening chat:", err);
    }
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedChat || !currentUserId) return;

    const messageText = newMessage.trim();

    const optimisticMessage = {
      _id: `temp-${Date.now()}`,
      chat: selectedChat._id,
      sender: currentUserId,
      text: messageText,
      createdAt: new Date().toISOString(),
      isMine: true,
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    scrollToBottom();

    socket.emit("sendMessage", {
      chatId: selectedChat._id,
      senderId: currentUserId,
      text: messageText,
    });

    setNewMessage("");
  };

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
      fetchChats();
    } catch (err) {
      alert("Action failed");
    }
  };

  const createGroup = async () => {
    if (!groupName) return alert("Group name is required");

    const formData = new FormData();
    formData.append("name", groupName);
    formData.append("description", groupDescription);
    formData.append("type", isPlanningGroup ? "planning" : "normal");
    formData.append("planningLocation", planningLocation); // add this
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
        prev.map((m) => (m._id === id ? { ...m, text: updated.text } : m)),
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

      setMessages((prev) =>
        prev.map((m) =>
          m._id === id ? { ...m, text: "This message was unsent" } : m,
        ),
      );

      socket.emit("messageDeleted", { messageId: id });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    let readTimeout;

    socket.on("newChatRequest", () => {
      setRequestCount((prev) => prev + 1);
      fetchRequests();
    });

    socket.on("requestUpdated", () => {
      fetchRequests();
      fetchChats();

      setRequestCount((prev) => Math.max(prev - 1, 0));
    });

    socket.on("messagesRead", ({ chatId }) => {
      setUnreadChats((prev) => prev.filter((chat) => chat._id !== chatId));
      fetchChats();
    });

    socket.on("newMessage", async (msg) => {
      const isCurrentChatOpen =
        selectedChat && msg.chat.toString() === selectedChat._id.toString();

      const myId = currentUserId;

      if (isCurrentChatOpen) {
        setMessages((prev) => {
          const exists = prev.some((m) => m._id === msg._id);
          if (exists) return prev;
          return [...prev, msg];
        });

        scrollToBottom();

        await fetch(`http://localhost:5000/api/chat/${msg.chat}/read`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        });

        socket.emit("markAsRead", { chatId: msg.chat });

        setUnreadChats((prev) => prev.filter((c) => c._id !== msg.chat));
      }

      setChats((prevChats) =>
        prevChats.map((chat) => {
          if (chat._id !== msg.chat) return chat;

          if (msg.sender._id === myId) {
            return { ...chat, lastMessage: msg };
          }

          return {
            ...chat,
            lastMessage: msg,
            unreadCount: (chat.unreadCount || 0) + 1,
          };
        }),
      );

      if (!isCurrentChatOpen && msg.sender._id !== myId) {
        fetchUnread();
        setUnreadCount((prev) => prev + 1);
      }
    });

    return () => {
      socket.off("receiveMessage");
      socket.off("newChatRequest");
      socket.off("requestUpdated");
      socket.off("messagesRead");
      socket.off("newMessage");
    };
  }, [selectedChat, token]);

  useEffect(() => {
    if (activeTab === "Unread") {
      fetchUnread();
    }
    if (activeTab === "Request") {
      fetchRequests();
    }
  }, [activeTab]);

  useEffect(() => {
    fetchUnread();
  }, [refreshTrigger]);

  const saveGroupEdit = async () => {
    if (!selectedChat) return;

    const formData = new FormData();
    if (editGroupName) formData.append("name", editGroupName);
    if (editGroupDescription !== undefined)
      formData.append("description", editGroupDescription);

    if (selectedChat.type === "planning") {
      if (editPlanningDate) formData.append("planningDate", editPlanningDate);
      if (editPlanningLocation !== undefined)
        formData.append("planningLocation", editPlanningLocation);
    }

    try {
      const res = await fetch(
        `http://localhost:5000/api/chat/group/${selectedChat._id}`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        },
      );

      const data = await res.json();

      if (res.ok) {
        alert("Group updated successfully!");
        setSelectedChat(data.chat);
        setShowGroupInfo(false);
        setIsEditingGroup(false);
        fetchChats();
      } else {
        alert(data.message || "Failed to update group");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating group");
    }
  };

  const sendGroupInvite = async (userId) => {
    if (!userId || !selectedChat) return;

    try {
      const res = await fetch("http://localhost:5000/api/chat/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          to: userId,
          chat: selectedChat._id,
          type: "group",
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Group invite sent successfully!");
        fetchRequests();
        if (searchQuery.length >= 2) {
          handleSearch({ target: { value: searchQuery } });
        }
      } else {
        alert(data.message || "Failed to send invite");
      }
    } catch (err) {
      console.error(err);
      alert("Network error");
    }
  };

  const removeMember = async (userIdToRemove) => {
    if (
      !selectedChat ||
      !window.confirm("Are you sure you want to remove this member?")
    )
      return;

    try {
      const res = await fetch(
        `http://localhost:5000/api/chat/${selectedChat._id}/members/${userIdToRemove}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const data = await res.json();

      if (res.ok) {
        alert("Member removed successfully");

        const participantsRes = await fetch(
          `http://localhost:5000/api/chat/${selectedChat._id}/participants`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const updatedParticipants = await participantsRes.json();

        setGroupParticipants(updatedParticipants);

        if (userIdToRemove === currentUserId) {
          setShowGroupInfo(false);
          setSelectedChat(null);
        } else {
          fetchChats();
        }
      } else {
        alert(data.message || "Failed to remove member");
      }
    } catch (err) {
      console.error(err);
      alert("Error removing member");
    }
  };

  const deleteGroup = async () => {
    if (
      !selectedChat ||
      !window.confirm(
        `Are you sure you want to delete the group "${selectedChat.name}"? This action cannot be undone.`,
      )
    )
      return;

    try {
      const res = await fetch(
        `http://localhost:5000/api/chat/group/${selectedChat._id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (res.ok) {
        alert("Group deleted successfully");
        setShowGroupInfo(false);
        setSelectedChat(null);
        fetchChats();
        setActiveTab("Chat");
      } else {
        const data = await res.json();
        alert(data.message || "Failed to delete group");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting group");
    }
  };

  return (
    <>
      <Navbar />
      <div className="chat-page">
        <div className="chat-container">
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
                Request
                {requestCount > 0 && <span className="red-dot"></span>}
              </button>
              <button
                className={activeTab === "Unread" ? "active" : ""}
                onClick={() => setActiveTab("Unread")}
              >
                Unread
                {unreadCount > 0 && <span className="red-dot"></span>}
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
                  {searchResults.map((user) => {
                    const status = chatStatus[user._id] || {};
                    const hasChat = status.hasChat;
                    const hasPending = status.hasPendingRequest;

                    return (
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
                        </div>

                        {hasChat ? (
                          <button
                            onClick={() => {
                              const chat = chats.find(
                                (c) =>
                                  !c.isGroup &&
                                  c.participants.some(
                                    (p) => p._id === user._id,
                                  ),
                              );
                              if (chat) openChat(chat);
                            }}
                            style={{
                              background: "#2196F3",
                              color: "white",
                              border: "none",
                              padding: "8px 16px",
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontSize: "13px",
                            }}
                          >
                            Open Chat
                          </button>
                        ) : hasPending ? (
                          <button
                            disabled
                            style={{
                              background: "#888",
                              color: "#ddd",
                              padding: "8px 12px",
                              borderRadius: "6px",
                            }}
                          >
                            Pending
                          </button>
                        ) : (
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
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="user-list">
              {activeTab === "Chat" &&
                chats.map((chat) => {
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
                            ? chat.lastMessage.text?.substring(0, 30) + "..."
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

              {activeTab === "Unread" &&
                unreadChats.map((chat) => {
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
                            ? chat.lastMessage.text?.substring(0, 30) + "..."
                            : "No messages yet"}
                          <span className="unread-count">
                            {" "}
                            ({chat.unreadCount})
                          </span>
                        </p>
                      </div>
                    </div>
                  );
                })}

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

          <div className="chat-area">
            {showCreateGroupForm ? (
              <div className="create-group-wrapper">
                <div className="create-group-container">
                  <IoArrowBack
                    className="back-arrow"
                    onClick={() => {
                      setShowCreateGroupForm(false);
                      setActiveTab("Chat");
                    }}
                  />

                  <div className="create-group-form">
                    <div className="create-group-header">
                      <span className="group-type-badge">
                        {isPlanningGroup
                          ? "Planning Group Chat"
                          : "Normal Group Chat"}
                      </span>
                    </div>

                    <div className="create-group-content">
                      <div className="group-avatar-upload">
                        <input
                          type="file"
                          id="group-photo"
                          accept="image/*"
                          onChange={(e) => setGroupPhoto(e.target.files[0])}
                          style={{ display: "none" }}
                        />
                        <label
                          htmlFor="group-photo"
                          className="avatar-upload-label"
                        >
                          <img
                            src={
                              groupPhoto
                                ? URL.createObjectURL(groupPhoto)
                                : "https://via.placeholder.com/120?text=Group"
                            }
                            alt="Group"
                            className="group-avatar-preview"
                          />
                          <div className="upload-overlay">Change Photo</div>
                        </label>
                      </div>

                      <input
                        type="text"
                        placeholder="Group Name"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        className="group-input"
                      />

                      <textarea
                        placeholder="Group Description (optional)"
                        value={groupDescription}
                        onChange={(e) => setGroupDescription(e.target.value)}
                        className="group-textarea"
                      />

                      {isPlanningGroup && (
                        <div className="planning-fields">
                          <input
                            type="text"
                            placeholder="Planning Location"
                            value={planningLocation}
                            onChange={(e) =>
                              setPlanningLocation(e.target.value)
                            }
                            className="group-input"
                          />
                          <input
                            type="datetime-local"
                            value={planningDate}
                            onChange={(e) => setPlanningDate(e.target.value)}
                            className="group-input"
                          />
                        </div>
                      )}

                      <div className="add-members-section">
                        <h4>Add Members</h4>

                        <div className="user-search-box small-search">
                          <FaSearch className="search-icon" />
                          <input
                            type="text"
                            placeholder="Search users to add..."
                            value={searchQuery}
                            onChange={handleSearch}
                          />
                        </div>

                        {searchResults.length > 0 && (
                          <div className="user-list-scroll">
                            {searchResults.map((user) => (
                              <div key={user._id} className="user-item-small">
                                <img
                                  src={
                                    user.profilePic
                                      ? `http://localhost:5000${user.profilePic}`
                                      : "https://via.placeholder.com/40"
                                  }
                                  alt={user.name}
                                  className="avatar small"
                                />
                                <span>{user.name}</span>
                                <button
                                  className="add-user-btn"
                                  onClick={() =>
                                    setSelectedMembers((prev) => [
                                      ...prev,
                                      user._id,
                                    ])
                                  }
                                >
                                  Add
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <button onClick={createGroup} className="create-group-btn">
                      Create Group
                    </button>
                  </div>
                </div>
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

                  <div className="header-menu-wrapper">
                    <FaEllipsisV
                      className="menu-icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowHeaderMenu(!showHeaderMenu);
                      }}
                    />

                    {showHeaderMenu && (
                      <div ref={headerMenuRef} className="header-menu">
                        {!selectedChat.isGroup ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const user = selectedChat.participants?.find(
                                (p) => p._id !== currentUserId,
                              );
                              if (user) navigate(`/profile/${user._id}`);
                              setShowHeaderMenu(false);
                            }}
                          >
                            View Profile
                          </button>
                        ) : (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              setShowHeaderMenu(false);

                              try {
                                const res = await fetch(
                                  `http://localhost:5000/api/chat/${selectedChat._id}/participants`,
                                  {
                                    headers: {
                                      Authorization: `Bearer ${token}`,
                                    },
                                  },
                                );
                                const data = await res.json();
                                setGroupParticipants(
                                  Array.isArray(data) ? data : [],
                                );
                              } catch (err) {
                                console.error(
                                  "Failed to fetch participants",
                                  err,
                                );
                                setGroupParticipants(
                                  Array.isArray(selectedChat.participants)
                                    ? selectedChat.participants
                                    : [],
                                );
                              }

                              setShowGroupInfo(true);
                            }}
                          >
                            Group Info
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="chat-body">
                  {messages.map((msg, i) => {
                    const isMine =
                      msg.sender?._id === currentUserId ||
                      msg.sender === currentUserId ||
                      msg.isMine === true;

                    const isUnsent =
                      msg.isDeleted === true ||
                      msg.text === "This message was unsent" ||
                      (msg.text &&
                        msg.text.trim() === "This message was unsent");

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
                  <div ref={messageEndRef} />
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

        {showGroupInfo && selectedChat?.isGroup && (
          <div
            className="modal-overlay"
            onClick={() => setShowGroupInfo(false)}
          >
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div className="group-type-header">
                  <span className="group-type-badge">
                    {selectedChat.type === "planning"
                      ? "Planning GC"
                      : "Normal GC"}
                  </span>
                </div>
                <button
                  className="close-btn"
                  onClick={() => {
                    setShowGroupInfo(false);
                    setIsEditingGroup(false);
                  }}
                >
                  ✕
                </button>
              </div>

              <div className="group-info-body">
                {isEditingGroup ? (
                  <div className="edit-group-form">
                    <input
                      type="text"
                      placeholder="Group Name"
                      value={editGroupName}
                      onChange={(e) => setEditGroupName(e.target.value)}
                    />
                    <textarea
                      placeholder="Group Description"
                      value={editGroupDescription}
                      onChange={(e) => setEditGroupDescription(e.target.value)}
                    />
                    {selectedChat.type === "planning" && (
                      <>
                        <input
                          type="text"
                          placeholder="Planning Location"
                          value={editPlanningLocation}
                          onChange={(e) =>
                            setEditPlanningLocation(e.target.value)
                          }
                        />
                        <input
                          type="datetime-local"
                          value={editPlanningDate}
                          onChange={(e) => setEditPlanningDate(e.target.value)}
                        />
                        <small style={{ color: "#e74c3c" }}>
                          Planning details can be edited only{" "}
                          {5 - (selectedChat.planningEditCount || 0)} more
                          time(s)
                        </small>
                      </>
                    )}
                    <div className="modal-actions">
                      <button onClick={() => setIsEditingGroup(false)}>
                        Cancel
                      </button>
                      <button onClick={saveGroupEdit} className="save-btn">
                        Save Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="group-avatar-large">
                      <img
                        src={
                          selectedChat.photo
                            ? `http://localhost:5000${selectedChat.photo}`
                            : "https://via.placeholder.com/120?text=Group"
                        }
                        alt={selectedChat.name}
                      />
                    </div>
                    <h3 className="group-name">{selectedChat.name}</h3>
                    <div className="info-item">
                      <strong>Description:</strong>
                      <p>
                        {selectedChat.description || "No description provided"}
                      </p>
                    </div>
                    {selectedChat.type === "planning" && (
                      <>
                        <div className="info-item">
                          <strong>Location:</strong>
                          <p>
                            {selectedChat.planningLocation || "Not specified"}
                          </p>
                        </div>
                        <div className="info-item">
                          <strong>Planning Date:</strong>
                          <p>
                            {selectedChat.planningDate
                              ? new Date(
                                  selectedChat.planningDate,
                                ).toLocaleString()
                              : "Not set"}
                          </p>
                        </div>
                      </>
                    )}
                    <div className="info-item">
                      <strong>Total Members:</strong>
                      <p>
                        {selectedChat.participants?.length ||
                          groupParticipants.length}
                      </p>
                    </div>
                    <div className="members-section">
                      <h4>
                        Members (
                        {
                          (Array.isArray(groupParticipants) &&
                          groupParticipants.length > 0
                            ? groupParticipants
                            : Array.isArray(selectedChat.participants)
                              ? selectedChat.participants
                              : []
                          ).length
                        }
                        )
                      </h4>
                      <div className="participants-list">
                        {(Array.isArray(groupParticipants) &&
                        groupParticipants.length > 0
                          ? groupParticipants
                          : Array.isArray(selectedChat.participants)
                            ? selectedChat.participants
                            : []
                        ).map((user) => (
                          <div key={user._id} className="participant-item">
                            <div className="participant-left">
                              <img
                                src={
                                  user.profilePic
                                    ? `http://localhost:5000${user.profilePic}`
                                    : "https://via.placeholder.com/40"
                                }
                                alt={user.name}
                                className="avatar small"
                              />
                              <strong>{user.name}</strong>
                            </div>
                            <div className="participant-right">
                              {user._id === selectedChat.admin?._id && (
                                <span className="admin-badge">Admin</span>
                              )}
                              {selectedChat.admin?._id === currentUserId &&
                                user._id !== currentUserId && (
                                  <button
                                    className="remove-member-btn"
                                    onClick={() => removeMember(user._id)}
                                  >
                                    Remove
                                  </button>
                                )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    {selectedChat.admin?._id === currentUserId && (
                      <div className="add-user-section">
                        <h4>Add User</h4>
                        <div className="user-search-box">
                          <FaSearch className="search-icon" />
                          <input
                            type="text"
                            placeholder="Search users to add..."
                            value={searchQuery}
                            onChange={handleSearch}
                          />
                        </div>
                        {searchResults.length > 0 && (
                          <div className="search-results">
                            {searchResults.map((user) => {
                              const participantsArray = Array.isArray(
                                selectedChat.participants,
                              )
                                ? selectedChat.participants
                                : [];
                              const groupParticipantsArray = Array.isArray(
                                groupParticipants,
                              )
                                ? groupParticipants
                                : [];
                              const isMember =
                                participantsArray.some(
                                  (p) => p._id === user._id,
                                ) ||
                                groupParticipantsArray.some(
                                  (p) => p._id === user._id,
                                );
                              const hasPendingRequest = Array.isArray(
                                pendingRequests,
                              )
                                ? pendingRequests.some(
                                    (req) =>
                                      req.to?._id === user._id ||
                                      req.to === user._id,
                                  )
                                : false;
                              return (
                                <div
                                  key={user._id}
                                  className="search-result-item"
                                >
                                  <img
                                    src={
                                      user.profilePic
                                        ? `http://localhost:5000${user.profilePic}`
                                        : "https://via.placeholder.com/40"
                                    }
                                    alt={user.name}
                                    className="avatar small"
                                  />
                                  <span>{user.name}</span>
                                  <button
                                    className={`status-btn 
                  ${isMember ? "member" : ""} 
                  ${hasPendingRequest ? "requested" : ""}`}
                                    onClick={() =>
                                      !isMember &&
                                      !hasPendingRequest &&
                                      sendGroupInvite(user._id)
                                    }
                                    disabled={isMember || hasPendingRequest}
                                  >
                                    {isMember
                                      ? "Member"
                                      : hasPendingRequest
                                        ? "Requested"
                                        : "Add"}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
              {!isEditingGroup && selectedChat.admin?._id === currentUserId && (
                <div className="modal-footer">
                  <button
                    className="edit-group-btn"
                    onClick={() => {
                      setIsEditingGroup(true);
                      setEditGroupName(selectedChat.name || "");
                      setEditGroupDescription(selectedChat.description || "");
                      setEditPlanningDate(
                        selectedChat.planningDate
                          ? new Date(selectedChat.planningDate)
                              .toISOString()
                              .slice(0, 16)
                          : "",
                      );
                      setEditPlanningLocation(
                        selectedChat.planningLocation || "",
                      );
                    }}
                  >
                    Edit Group
                  </button>
                  <button className="delete-group-btn" onClick={deleteGroup}>
                    Delete Group
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default ChatPage;
