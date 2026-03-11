import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8080"
});

/* ── TOKEN ── */
export const setToken = (token) => {
  if (token) {
    API.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete API.defaults.headers.common["Authorization"];
  }
};

/* ── GET USER ── */
export const getUser = () => JSON.parse(localStorage.getItem("user")) || null;

/* ── LOGIN ── */
export const login = async (email, password) => {
  const res = await API.post("/auth/login", { email, password });
  const data = res.data;
  if (!data) throw new Error("Authentication failed");
  localStorage.setItem("user", JSON.stringify({ name: data.name, email: data.email }));
  localStorage.setItem("token", data.token);
  return data;
};

/* ── SIGNUP ── */
export const signup = async (name, email, password) => {
  const res = await API.post("/auth/signup", { name, email, password });
  return res.data;
};

/* ── SEND MESSAGE ── email + conversationId backend mein save hoga ── */
export const sendMessage = async (message, conversationId) => {
  const user = getUser();
  const res = await API.post("/chat", {
    message,
    email: user?.email,
    conversationId,
  });
  return res.data;
};

/* ── FILE UPLOAD ── */
export const uploadFile = async (file) => {
  const form = new FormData();
  form.append("file", file);
  const res = await API.post("/file/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

/* ── GET CHATS BY CONVERSATION ID ── ✅ new endpoint */
export const getChatsByConversation = async (conversationId) => {
  const res = await API.get(`/conversation/${conversationId}/chats`);
  return res.data;
};

/* ── GET ALL CHATS BY EMAIL ── */
export const getChats = async () => {
  const user = getUser();
  if (!user) return [];
  const res = await API.get("/chat/" + user.email);
  return res.data;
};

/* ── CREATE CONVERSATION ── */
export const createConversation = async (email, title = "New Chat") => {
  const res = await API.post("/conversation", { email, title });
  return res.data;
};

/* ── GET CONVERSATIONS ── */
export const getConversations = async () => {
  const user = getUser();
  if (!user) return [];
  const res = await API.get("/conversation/" + user.email);
  return res.data;
};

/* ── DELETE CONVERSATION ── */
export const deleteConversation = async (conversationId) => {
  const res = await API.delete(`/conversation/${conversationId}`);
  return res.data;
};

export default API;