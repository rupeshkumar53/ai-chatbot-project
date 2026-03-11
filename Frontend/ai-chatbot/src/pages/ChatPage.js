import { useState, useEffect, useRef, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import "./ChatPage.css";

import {
  sendMessage,
  uploadFile,
  setToken,
  createConversation,
  getConversations,
  getChatsByConversation,
  deleteConversation,
  login,
  signup,
} from "../services/api";

/* ─────────────────────────────────────────────
   HELPER
───────────────────────────────────────────── */
const scrollToBottom = (ref) => {
  if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
};

/* ─────────────────────────────────────────────
   SIDEBAR
───────────────────────────────────────────── */
function Sidebar({ conversations, selectedId, onSelect, onDelete, onNew }) {
  return (
    <aside className="lumi-sidebar">
      <div className="ls-head">
        <div className="ls-logo">
          <div className="ls-logo-mark">
            <svg viewBox="0 0 24 24" fill="none" stroke="white"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <div>
            <div className="ls-logo-name">Lumi</div>
            <div className="ls-logo-sub">AI Assistant</div>
          </div>
        </div>
        <button className="ls-new" onClick={onNew}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Conversation
        </button>
      </div>

      <div className="ls-list">
        {conversations.length > 0 ? (
          <>
            <div className="ls-section">Recent</div>
            {conversations.map((c) => (
              <div
                key={c.id}
                className={`ls-item ${c.id === selectedId ? "active" : ""}`}
                onClick={() => onSelect(c)}
              >
                <div className="ls-item-dot" />
                <div className="ls-item-title">{c.title || "Untitled Chat"}</div>
                <button
                  className="ls-del"
                  onClick={(e) => { e.stopPropagation(); onDelete(c.id); }}
                >✕</button>
              </div>
            ))}
          </>
        ) : (
          <div className="ls-empty-hint">
            No history yet.<br />Sign in &amp; start chatting!
          </div>
        )}
      </div>

      <div className="ls-foot">Powered by Gemini API</div>
    </aside>
  );
}

/* ─────────────────────────────────────────────
   EMPTY STATE
───────────────────────────────────────────── */
const CHIPS = [
  "Explain quantum computing 🔬",
  "Write a short poem ✍️",
  "Debug my code 🐛",
  "Summarise an article 📄",
  "Give me a recipe idea 🍳",
];

function EmptyState({ onChip, user, openAuth }) {
  return (
    <div className="le-wrap">
      <div className="le-icon">
        <svg viewBox="0 0 32 32" fill="none" stroke="white"
          strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
          width="36" height="36">
          <path d="M28 19.3A13 13 0 1 0 6 24.5L4 30l6.2-1.9A13 13 0 0 0 28 19.3z"/>
          <path d="M11 13h10M11 17h7"/>
        </svg>
      </div>
      <div className="le-h">Ask me <em>anything</em></div>
      <div className="le-sub">
        Chat freely — no login needed.<br />
        Sign in to save your conversation history.
      </div>
      {!user && (
        <div className="le-notice" onClick={openAuth}>
          💾 History won't be saved — <b>Sign in to save</b>
        </div>
      )}
      <div className="le-chips">
        {CHIPS.map((c) => (
          <button key={c} className="le-chip" onClick={() => onChip(c)}>{c}</button>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MESSAGE ROW
───────────────────────────────────────────── */
function MessageRow({ message, idx }) {
  const isUser = message.role === "user";
  const time = new Date().toLocaleTimeString([], {
    hour: "2-digit", minute: "2-digit",
  });
  const copyText = () => navigator.clipboard.writeText(message.content);

  return (
    <div
      className={`lumi-row ${isUser ? "row-user" : "row-ai"}`}
      style={{ animationDelay: `${idx * 0.03}s` }}
    >
      <div className="lumi-row-inner">
        <div className={`lumi-av ${isUser ? "av-user" : "av-ai"}`}>
          {isUser ? "U" : "✦"}
        </div>
        <div className="lumi-row-body">
          <div className="lumi-row-meta">
            <span className="lumi-row-who">{isUser ? "You" : "Lumi"}</span>
            <span className="lumi-row-time">{time}</span>
          </div>
          {message.filePreview && (
            message.isImage
              ? <img src={message.filePreview} alt="upload" className="msg-file-img" />
              : <div className="msg-file-name">📎 {message.filePreview}</div>
          )}
          <div className={`lumi-row-text ${isUser ? "" : "prose"}`}>
            {isUser
              ? message.content
              : <ReactMarkdown>{message.content}</ReactMarkdown>
            }
          </div>
          {!isUser && (
            <button className="lumi-copy" onClick={copyText}>Copy</button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   TYPING INDICATOR
───────────────────────────────────────────── */
function TypingIndicator() {
  return (
    <div className="lumi-typing">
      <div className="lumi-typing-inner">
        <div className="lumi-av av-ai">✦</div>
        <div className="lumi-row-body">
          <div className="lumi-row-meta">
            <span className="lumi-row-who">Lumi</span>
            <span className="lumi-row-time">typing…</span>
          </div>
          <div className="ti-dots">
            <div className="ti-dot" />
            <div className="ti-dot" />
            <div className="ti-dot" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   INPUT BAR
───────────────────────────────────────────── */
function InputBar({ onSend }) {
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const textRef = useRef(null);
  const fileRef = useRef(null);

  const submit = () => {
    if (!text.trim() && !file) return;
    onSend({ text: text.trim(), file });
    setText("");
    setFile(null);
    if (textRef.current) textRef.current.style.height = "24px";
  };

  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
  };

  const onTextInput = (e) => {
    e.target.style.height = "24px";
    e.target.style.height = Math.min(e.target.scrollHeight, 180) + "px";
    setText(e.target.value);
  };

  const filePreviewUrl =
    file && file.type.startsWith("image/") ? URL.createObjectURL(file) : null;

  return (
    <div className="lumi-input-area">
      <div className="lumi-input-inner">
        {file && (
          <div className="file-strip">
            {filePreviewUrl
              ? <img src={filePreviewUrl} alt="preview" />
              : <span>📎</span>
            }
            <span className="file-strip-name">{file.name}</span>
            <button className="file-strip-rm" onClick={() => setFile(null)}>✕</button>
          </div>
        )}
        <div className="lumi-box">
          <textarea
            ref={textRef}
            className="lumi-textarea"
            placeholder={file ? "Add a message about this file…" : "Message Lumi… (↵ to send)"}
            value={text}
            onChange={onTextInput}
            onKeyDown={onKey}
            rows={1}
          />
          <div className="lumi-actions">
            <button className="lumi-file-btn" onClick={() => fileRef.current.click()} title="Attach file">
              📎
            </button>
            <input
              ref={fileRef}
              type="file"
              className="lumi-file-input"
              onChange={(e) => setFile(e.target.files[0] || null)}
              accept="image/*,.pdf,.txt,.doc,.docx"
            />
            <button className="lumi-send" onClick={submit} disabled={!text.trim() && !file}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="19" x2="12" y2="5"/>
                <polyline points="5 12 12 5 19 12"/>
              </svg>
            </button>
          </div>
        </div>
        <div className="lumi-input-foot">
          <span className="lumi-hint">↵ Send · ⇧↵ New line · 📎 Attach</span>
          <span className="lumi-hint">{text.length} chars</span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   AUTH MODAL
───────────────────────────────────────────── */
function AuthModal({ close, onLogin }) {
  const [isLogin, setIsLogin]   = useState(true);
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [msg, setMsg]           = useState({ type: "", text: "" });

  const submit = async () => {
    setMsg({ type: "", text: "" });
    setLoading(true);
    try {
      if (isLogin) {
        const userData = await login(email, password);
        onLogin(userData);
        close();
      } else {
        await signup(name, email, password);
        setMsg({ type: "ok", text: "Account created! Please sign in." });
        setIsLogin(true);
        setName(""); setEmail(""); setPassword("");
      }
    } catch {
      setMsg({ type: "err", text: "Authentication failed. Please check your details." });
    }
    setLoading(false);
  };

  const onKey = (e) => { if (e.key === "Enter") submit(); };

  return (
    <div className="am-overlay" onClick={close}>
      <div className="am-box" onClick={(e) => e.stopPropagation()}>
        <div className="am-banner">
          <div className="am-banner-glyph">✦</div>
          <div className="am-banner-text">
            <div className="am-banner-title">
              {isLogin ? "Welcome back" : "Create account"}
            </div>
            <div className="am-banner-sub">
              {isLogin ? "Sign in to save your chat history" : "Join to keep your conversations"}
            </div>
          </div>
          <button className="am-close" onClick={close}>✕</button>
        </div>

        <div className="am-body">
          {msg.text && (
            <div className={`am-alert ${msg.type === "ok" ? "am-ok" : "am-err"}`}>
              {msg.text}
            </div>
          )}
          {!isLogin && (
            <div className="am-field">
              <label className="am-label">Full Name</label>
              <input className="am-input" placeholder="John Doe"
                value={name} onChange={(e) => setName(e.target.value)} onKeyDown={onKey}/>
            </div>
          )}
          <div className="am-field">
            <label className="am-label">Email</label>
            <input className="am-input" type="email" placeholder="you@example.com"
              value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={onKey}/>
          </div>
          <div className="am-field">
            <label className="am-label">Password</label>
            <input className="am-input" type="password" placeholder="••••••••"
              value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={onKey}/>
          </div>
          <button className="am-submit" onClick={submit} disabled={loading}>
            {loading ? "Please wait…" : isLogin ? "Sign in →" : "Create account →"}
          </button>
          <div className="am-switch"
            onClick={() => { setIsLogin(!isLogin); setMsg({ type: "", text: "" }); }}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <span>{isLogin ? "Sign up" : "Sign in"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════════
   MAIN PAGE
═════════════════════════════════════════════ */
export default function ChatPage() {
  const [user, setUser]                     = useState(() => JSON.parse(localStorage.getItem("user")));
  const [messages, setMessages]             = useState([]);
  const [typing, setTyping]                 = useState(false);
  const [showAuth, setShowAuth]             = useState(false);
  const [conversations, setConversations]   = useState([]);
  const [conversationId, setConversationId] = useState(null);

  const chatRef = useRef(null);

  /* ── set token on mount ── */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) setToken(token);
  }, []);

  /* ── user change hone par (login / logout) ── */
  useEffect(() => {
    if (user) {
      const token = localStorage.getItem("token");
      if (token) setToken(token);
      loadConversations();
    } else {
      setToken(null);
      setConversations([]);
      setMessages([]);
      setConversationId(null);
    }
  }, [user]);

  useEffect(() => { scrollToBottom(chatRef); }, [messages]);

  /* ── conversations load karo ── */
  const loadConversations = useCallback(async () => {
    try {
      const data = await getConversations();
      setConversations(data);
      // sirf tab first conversation load karo jab koi selected nahi
      setConversationId((prev) => {
        if (!prev && data.length > 0) {
          loadMessages(data[0].id);
          return data[0].id;
        }
        return prev;
      });
    } catch (e) { console.error(e); }
  }, [user]);

  /* ── ✅ FIXED: getChatsByConversation se load karo ── */
  const loadMessages = async (convId) => {
    if (!convId) return;
    try {
      // ✅ direct conversation ke chats fetch karo — email filter ki zaroorat nahi
      const data = await getChatsByConversation(convId);

      const mapped = [];
      data.forEach((m) => {
        if (m.message)  mapped.push({ role: "user", content: m.message });
        if (m.response) mapped.push({ role: "ai",   content: m.response });
      });

      setMessages(mapped);
    } catch (e) {
      console.error("loadMessages error:", e);
      setMessages([]);
    }
  };

  /* ── login ── */
  const handleLogin = (userData) => {
    const userObj = { name: userData.name, email: userData.email };
    localStorage.setItem("user", JSON.stringify(userObj));
    localStorage.setItem("token", userData.token);
    setToken(userData.token);
    setUser(userObj);
  };

  /* ── logout ── */
  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
  };

  /* ── new conversation ── */
  const handleNew = async () => {
    if (!user) return;
    try {
      const c = await createConversation(user.email);
      setConversationId(c.id);
      setMessages([]);
      loadConversations();
    } catch (e) { console.error(e); }
  };

  /* ── send message ── */
  const handleSend = async ({ text, file }) => {
    let convId = conversationId;

    let filePreview = null;
    let isImage = false;
    if (file) {
      try { await uploadFile(file); } catch (e) { console.error("Upload failed", e); }
      isImage = file.type.startsWith("image/");
      filePreview = isImage ? URL.createObjectURL(file) : file.name;
    }

    // user message turant dikhao
    setMessages((p) => [...p, {
      role: "user",
      content: text || (file ? `Uploaded: ${file.name}` : ""),
      filePreview,
      isImage,
    }]);
    setTyping(true);

    // logged in ho toh conversation banao
    if (user && !convId) {
      try {
        const c = await createConversation(user.email, text || "File upload");
        convId = c.id;
        setConversationId(convId);
        loadConversations();
      } catch (e) { console.error(e); }
    }

    // AI call
    try {
      const msgToSend = text || (file ? `I uploaded: ${file.name}` : "");
      const res = await sendMessage(msgToSend, convId);
      setMessages((p) => [...p, { role: "ai", content: res }]);
    } catch {
      setMessages((p) => [...p, {
        role: "ai",
        content: "Something went wrong. Please try again.",
      }]);
    }
    setTyping(false);
  };

  /* ── delete conversation ── */
  const handleDelete = async (id) => {
    try {
      await deleteConversation(id);
      if (id === conversationId) {
        setConversationId(null);
        setMessages([]);
      }
      loadConversations();
    } catch (e) { console.error(e); }
  };

  /* ══ RENDER ══ */
  return (
    <div className="lumi-app">

      <Sidebar
        conversations={conversations}
        selectedId={conversationId}
        onSelect={(c) => { setConversationId(c.id); loadMessages(c.id); }}
        onDelete={handleDelete}
        onNew={handleNew}
      />

      <div className="lumi-main">

        {/* Header */}
        <header className="lumi-header">
          <div className="lh-left">
            <div className="lh-badge">
              <div className="lh-badge-dot" /> Online
            </div>
            <div className="lh-model">Model: <b>Gemini Flash</b></div>
          </div>
          <div className="lh-right">
            {user ? (
              <div className="lh-user">
                <div className="lh-avatar">
                  {(user.name || user.email || "U")[0].toUpperCase()}
                </div>
                <span className="lh-uname">{user.name || user.email}</span>
                <button className="lh-logout" onClick={handleLogout}>Sign out</button>
              </div>
            ) : (
              <button className="lh-signin" onClick={() => setShowAuth(true)}>
                Sign in to save history
              </button>
            )}
          </div>
        </header>

        {/* Messages */}
        <div className="lumi-msgs" ref={chatRef}>
          {messages.length === 0 && !typing ? (
            <EmptyState
              onChip={(t) => handleSend({ text: t, file: null })}
              user={user}
              openAuth={() => setShowAuth(true)}
            />
          ) : (
            <>
              <div className="lumi-divider"><span>Today</span></div>
              {messages.map((m, i) => (
                <MessageRow key={i} message={m} idx={i} />
              ))}
              {typing && <TypingIndicator />}
            </>
          )}
        </div>

        <InputBar onSend={handleSend} />
      </div>

      {showAuth && (
        <AuthModal
          close={() => setShowAuth(false)}
          onLogin={handleLogin}
        />
      )}
    </div>
  );
}