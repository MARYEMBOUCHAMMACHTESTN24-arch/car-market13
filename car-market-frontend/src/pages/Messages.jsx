import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { messagesAPI } from '../services/api';
import { motion } from 'framer-motion';

/* ─────────────────────────────────────────────
   Avatar initials bubble
 ───────────────────────────────────────────── */
const Avatar = ({ name = '?', isAdmin }) => (
  <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-sm font-bold text-white shadow-md border
    ${isAdmin ? 'bg-red-600 border-red-500/20' : 'bg-slate-700 border-slate-600/20'}`}>
    {String(name).charAt(0).toUpperCase()}
  </div>
);

/* ─────────────────────────────────────────────
   Main Messages Component
 ───────────────────────────────────────────── */
const Messages = ({ messages: propMessages, fetchMessages, showToast }) => {
  const { t, i18n } = useTranslation();
  const [messages, setMessages]           = useState(propMessages || []);
  const [selectedMsg, setSelectedMsg]     = useState(() => {
    const saved = sessionStorage.getItem('autoMarket_selectedMsg');
    return saved ? JSON.parse(saved) : null;
  });
  const [conversation, setConversation]   = useState(null);
  const [loadingChat, setLoadingChat]     = useState(false);
  const [replyText, setReplyText]         = useState('');
  const [sending, setSending]             = useState(false);
  const [searchQuery, setSearchQuery]     = useState('');
  const [selectedFile, setSelectedFile]   = useState(null);
  const [chatCache, setChatCache]         = useState(() => {
    const saved = sessionStorage.getItem('autoMarket_chatCache');
    return saved ? JSON.parse(saved) : {};
  });
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);
  const fileInputRef = useRef(null);

  const isRtl = i18n.language?.startsWith('ar');
  const langLocale = i18n.language?.startsWith('ar') ? 'ar-EG' : i18n.language === 'fr' ? 'fr-FR' : 'en-US';

  /* ─────────────────────────────────────────────
     Tiny helpers: format timestamps
   ───────────────────────────────────────────── */
  const fmtTime = (d) => {
    if (!d) return '';
    const date = new Date(d);
    return date.toLocaleString(langLocale, {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };
  const fmtDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString(langLocale, { day: '2-digit', month: 'short', year: 'numeric' });
  };

  /* ─────────────────────────────────────────────
     Single chat bubble
   ───────────────────────────────────────────── */
  const ChatBubble = ({ msg, isAdmin }) => {
    const bubbleDirection = isRtl
      ? (isAdmin ? 'flex-row' : 'flex-row-reverse')
      : (isAdmin ? 'flex-row-reverse' : 'flex-row');

    return (
      <div className={`flex gap-3.5 items-end ${bubbleDirection}`}>
        <Avatar name={msg.sender_name} isAdmin={isAdmin} />
        <div className={`max-w-[72%] ${isAdmin ? (isRtl ? 'items-start' : 'items-end') : (isRtl ? 'items-end' : 'items-start')} flex flex-col gap-1.5`}>
          <span className={`text-[10px] font-bold text-slate-500 uppercase tracking-widest ${isAdmin ? (isRtl ? 'text-left' : 'text-right') : (isRtl ? 'text-right' : 'text-left')}`}>
            {msg.sender_name}
          </span>
          <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-lg border flex flex-col gap-2.5
            ${isAdmin
              ? 'bg-red-600 text-white border-red-500/20 ' + (isRtl ? 'rounded-bl-sm' : 'rounded-br-sm')
              : 'bg-[#111827] text-slate-200 border-white/5 ' + (isRtl ? 'rounded-br-sm' : 'rounded-bl-sm')}`}>
            
            {msg.file_url && (
              <div className="w-full">
                {msg.file_type?.startsWith('image/') ? (
                  <a href={msg.file_url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl">
                    <img src={msg.file_url} alt="Attachment" className="max-w-full rounded-xl max-h-64 object-contain bg-black/40 hover:scale-[1.02] transition-transform duration-300" />
                  </a>
                ) : (
                  <a href={msg.file_url} target="_blank" rel="noreferrer" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isAdmin ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-white/5 hover:bg-white/10 text-slate-200'}`}>
                    <svg className="w-5 h-5 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    <span className="truncate text-xs font-semibold">{msg.file_name || t('admin.msg_download_attachment') || 'Download Attachment'}</span>
                  </a>
                )}
              </div>
            )}
            
            {msg.body && <span className="font-medium">{msg.body}</span>}
          </div>
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{fmtTime(msg.created_at)}</span>
        </div>
      </div>
    );
  };

  /* ─────────────────────────────────────────────
     Status badge
   ───────────────────────────────────────────── */
  const StatusBadge = ({ msg }) => {
    const isNew    = !msg.is_read && msg.status !== 'replied';
    const isReplied = msg.status === 'replied';
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider border
        ${isReplied ? 'bg-emerald-600/10 text-emerald-500 border-emerald-500/10' : isNew ? 'bg-red-600/10 text-red-500 border-red-500/10' : 'bg-slate-800 text-slate-400 border-white/5'}`}>
        {isReplied ? (t('admin.msg_status_replied') || 'Replied') : isNew ? (t('admin.msg_status_new') || 'New') : (t('admin.msg_status_read') || 'Read')}
      </span>
    );
  };

  /* Load all messages if none are passed via props */
  useEffect(() => {
    if (!propMessages || propMessages.length === 0) {
      const loadAll = async () => {
        try {
          const res = await messagesAPI.getAll();
          const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
          setMessages(list);
        } catch (e) {
          console.error(e);
        }
      };
      loadAll();
    } else {
      setMessages(propMessages);
    }
  }, [propMessages]);

  /* sync state → sessionStorage */
  useEffect(() => {
    if (selectedMsg) sessionStorage.setItem('autoMarket_selectedMsg', JSON.stringify(selectedMsg));
    else sessionStorage.removeItem('autoMarket_selectedMsg');
  }, [selectedMsg]);

  useEffect(() => {
    sessionStorage.setItem('autoMarket_chatCache', JSON.stringify(chatCache));
  }, [chatCache]);

  /* scroll to bottom whenever chat_messages change */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.chatMessages]);

  /* ── fetch conversation on selection ── */
  useEffect(() => {
    if (!selectedMsg?.id) return;
    
    const fetchChat = async () => {
      if (chatCache[selectedMsg.id]) {
        setConversation(chatCache[selectedMsg.id]);
        return;
      }

      setLoadingChat(true);
      try {
        const res = await messagesAPI.getConversation(selectedMsg.id);
        setConversation(res.data);
        setChatCache(prev => ({ ...prev, [selectedMsg.id]: res.data }));
      } catch (err) {
        console.error('Failed to load conversation:', err);
        setConversation({
          id: null,
          chatMessages: [
            { id: 'fallback-1', sender_name: selectedMsg.name, sender_role: 'client', body: selectedMsg.message, created_at: selectedMsg.created_at },
            ...(selectedMsg.reply ? [{ id: 'fallback-2', sender_name: 'Admin', sender_role: 'admin', body: selectedMsg.reply, created_at: selectedMsg.updated_at }] : []),
          ],
        });
      } finally {
        setLoadingChat(false);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    };

    fetchChat();
  }, [selectedMsg?.id]);

  /* ── open a conversation ── */
  const openConversation = useCallback(async (msg) => {
    if (selectedMsg?.id !== msg.id && !chatCache[msg.id]) {
      setConversation(null);
    }
    
    setSelectedMsg(msg);
    setReplyText('');
    setSelectedFile(null);

    if (!msg.is_read) {
      try {
        await messagesAPI.markAsRead(msg.id);
        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, is_read: true } : m));
      } catch (err) {
        console.error('Failed to mark read', err);
      }
    }
  }, [selectedMsg, chatCache]);

  /* ── send a reply ── */
  const handleSend = async (e) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    
    if ((!replyText.trim() && !selectedFile) || !selectedMsg) return;

    setSending(true);
    const optimisticMsg = {
      id: `opt-${Date.now()}`,
      sender_name: 'Admin',
      sender_role: 'admin',
      body: replyText.trim(),
      created_at: new Date().toISOString(),
      file_name: selectedFile ? selectedFile.name : null,
      file_url: selectedFile && selectedFile.type.startsWith('image/') ? URL.createObjectURL(selectedFile) : null,
      file_type: selectedFile ? selectedFile.type : null,
    };

    setConversation(prev => ({
      ...prev,
      chatMessages: [...(prev?.chatMessages || []), optimisticMsg],
    }));
    const sentText = replyText.trim();
    const sentFile = selectedFile;
    setReplyText('');
    setSelectedFile(null);

    try {
      const formData = new FormData();
      if (sentText) formData.append('reply', sentText);
      else formData.append('reply', '');
      if (sentFile) formData.append('file', sentFile);

      const res = await messagesAPI.reply(selectedMsg.id, formData);
      setConversation(prev => {
        const updated = {
          ...prev,
          chatMessages: [...(prev?.chatMessages || []).filter(m => m.id !== optimisticMsg.id), res.data.data],
        };
        setChatCache(c => ({ ...c, [selectedMsg.id]: updated }));
        return updated;
      });
      setMessages(prev => prev.map(m =>
        m.id === selectedMsg.id ? { ...m, status: 'replied', is_read: true } : m
      ));
    } catch (err) {
      console.error('Send failed:', err);
      setConversation(prev => ({
        ...prev,
        chatMessages: (prev?.chatMessages || []).filter(m => m.id !== optimisticMsg.id),
      }));
      setReplyText(sentText);
      setSelectedFile(sentFile);
      showToast?.(t('admin.msg_send_failed') || 'Failed to send reply', 'error');
    } finally {
      setSending(false);
    }
  };

  /* ── delete a message ── */
  const handleDelete = async (id) => {
    if (!window.confirm(t('admin.msg_confirm_delete') || 'Delete this conversation? This cannot be undone.')) return;
    try {
      await messagesAPI.delete(id);
      setMessages(prev => prev.filter(m => m.id !== id));
      if (selectedMsg?.id === id) { setSelectedMsg(null); setConversation(null); }
      fetchMessages?.();
      showToast?.(t('admin.msg_delete_success') || 'Conversation deleted');
    } catch (err) {
      console.error('Delete failed:', err);
      showToast?.(t('admin.msg_delete_failed') || 'Failed to delete conversation', 'error');
    }
  };

  /* ── filtered list ── */
  const filtered = messages.filter(m => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (m.name || '').toLowerCase().includes(q) ||
      (m.email || '').toLowerCase().includes(q) ||
      (m.subject || '').toLowerCase().includes(q) ||
      (m.message || '').toLowerCase().includes(q)
    );
  });

  const unreadCount = messages.filter(m => !m.is_read && m.status !== 'replied').length;

  return (
    <div className="flex h-[calc(100vh-180px)] bg-[#111827] rounded-[24px] overflow-hidden border border-white/5 shadow-2xl" dir={isRtl ? 'rtl' : 'ltr'}>

      {/* LEFT PANEL — Conversation list */}
      <div className={`w-[340px] flex-shrink-0 bg-[#111827] flex flex-col ${isRtl ? 'border-l' : 'border-r'} border-white/5`}>
        {/* Header */}
        <div className="px-5 pt-6 pb-4 border-b border-white/5 bg-white/[0.01]">
          <div className={`flex items-center justify-between mb-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <div className={isRtl ? 'text-right' : 'text-left'}>
              <h2 className="text-lg font-bold text-white">{t('admin.msg_title') || 'Inbound Messages'}</h2>
              {unreadCount > 0 && (
                <span className="text-xs text-red-500 font-bold uppercase tracking-wider">{unreadCount} {t('admin.msg_unread') || 'Unread'}</span>
              )}
            </div>
          </div>
          {/* Search */}
          <div className="relative">
            <svg className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 ${isRtl ? 'right-3' : 'left-3'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={t('admin.msg_search_placeholder') || 'Search conversations...'}
              className={`w-full py-2.5 bg-[#0B0F19] border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-red-500/30 transition-all ${isRtl ? 'pr-9 pl-4' : 'pl-9 pr-4'}`}
            />
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto divide-y divide-white/[0.02]">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-3 p-8">
              <svg className="w-12 h-12 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="text-xs font-bold uppercase tracking-wider">{t('admin.msg_no_conversations') || 'No Conversations'}</span>
            </div>
          ) : (
            filtered.map(msg => {
              const isActive  = selectedMsg?.id === msg.id;
              const isNew     = !msg.is_read && msg.status !== 'replied';
              return (
                <div
                  key={msg.id}
                  onClick={() => openConversation(msg)}
                  className={`relative flex items-start gap-3 px-4 py-4 cursor-pointer transition-all group
                    ${isActive 
                      ? 'bg-white/[0.02] border-l-2 border-l-red-500' 
                      : 'hover:bg-white/[0.01] border-l-2 border-l-transparent'}`}
                >
                  <Avatar name={msg.name} isAdmin={false} />

                  <div className="flex-1 min-w-0">
                    <div className={`flex items-start justify-between gap-1 ${isRtl ? 'flex-row-reverse' : ''}`}>
                      <span className={`text-sm truncate ${isNew ? 'font-bold text-white' : 'font-semibold text-slate-300'}`}>
                        {msg.name}
                      </span>
                      <span className="text-[9px] font-bold text-slate-500 shrink-0 mt-0.5">{fmtDate(msg.created_at)}</span>
                    </div>
                    <div className={`text-xs truncate mt-0.5 ${isRtl ? 'text-right' : 'text-left'} ${isNew ? 'font-bold text-red-400' : 'text-slate-400'}`}>
                      {msg.subject || 'No Subject'}
                    </div>
                    <div className={`text-[11px] text-slate-500 truncate mt-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                      {msg.message}
                    </div>
                    <div className={`mt-2.5 ${isRtl ? 'text-right' : 'text-left'}`}>
                      <StatusBadge msg={msg} />
                    </div>
                  </div>

                  {isNew && (
                    <span className={`absolute top-4 w-2 h-2 bg-red-600 rounded-full shadow-lg shadow-red-600/50 ${isRtl ? 'left-4' : 'right-4'}`}></span>
                  )}

                  <button
                    onClick={e => { e.stopPropagation(); handleDelete(msg.id); }}
                    className={`absolute bottom-3 p-1 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all border border-transparent hover:border-red-500/20 ${isRtl ? 'left-3' : 'right-3'}`}
                    title="Delete"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT PANEL — Chat thread */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0B0F19]">
        {!selectedMsg ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-4">
            <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center border border-white/5 shadow-inner">
              <svg className="w-10 h-10 text-slate-400 opacity-40 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div className="text-center">
              <p className="font-bold text-white text-base">{t('admin.msg_select') || 'Select a conversation'}</p>
              <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">{t('admin.msg_select_desc') || 'Choose a client message from the left to view history'}</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className={`h-16 bg-[#111827] border-b border-white/5 px-6 flex items-center justify-between flex-shrink-0 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <Avatar name={selectedMsg.name} isAdmin={false} />
                <div className={isRtl ? 'text-right' : 'text-left'}>
                  <p className="text-sm font-bold text-white leading-tight">{selectedMsg.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{selectedMsg.email}</p>
                </div>
                {selectedMsg.subject && (
                  <span className={`px-3 py-1 bg-white/5 border border-white/5 text-slate-300 text-[10px] font-bold rounded-full uppercase tracking-wider truncate max-w-[200px] ${isRtl ? 'mr-3' : 'ml-3'}`}>
                    {selectedMsg.subject}
                  </span>
                )}
              </div>
              <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <StatusBadge msg={selectedMsg} />
                <button
                  onClick={() => handleDelete(selectedMsg.id)}
                  className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all border border-transparent hover:border-red-500/15"
                  title="Delete conversation"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
                <button
                  onClick={() => { setSelectedMsg(null); setConversation(null); }}
                  className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 bg-[#0B0F19] custom-scrollbar">
              {loadingChat ? (
                <div className="flex items-center justify-center h-full">
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative w-10 h-10">
                      <div className="absolute inset-0 border-4 border-white/5 rounded-full"></div>
                      <div className="absolute inset-0 border-4 border-red-600 rounded-full border-t-transparent animate-spin"></div>
                    </div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest animate-pulse">{t('admin.msg_decrypting') || 'Decrypting thread...'}</span>
                  </div>
                </div>
              ) : conversation?.chatMessages?.length ? (
                <>
                  {conversation.chatMessages.map((msg) => (
                    <ChatBubble
                      key={msg.id}
                      msg={msg}
                      isAdmin={msg.sender_role === 'admin'}
                    />
                  ))}
                  <div ref={bottomRef} />
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-500 text-xs font-bold uppercase tracking-wider">
                  {t('admin.msg_no_messages') || 'No Messages Found'}
                </div>
              )}
            </div>

            {/* Reply input bar */}
            <form
              onSubmit={handleSend}
              className="bg-[#111827] border-t border-white/5 px-4 py-3.5 flex flex-col gap-3 flex-shrink-0"
            >
              {/* File Preview Area */}
              {selectedFile && (
                <div className={`flex items-center gap-3 p-2 bg-[#0B0F19] border border-white/5 rounded-xl w-fit ${isRtl ? 'pl-4' : 'pr-4'}`}>
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#111827] border border-white/5 flex items-center justify-center shrink-0">
                    {selectedFile.type.startsWith('image/') ? (
                      <img src={URL.createObjectURL(selectedFile)} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    )}
                  </div>
                  <div className={`flex flex-col min-w-[120px] max-w-[200px] ${isRtl ? 'text-right' : 'text-left'}`}>
                    <span className="text-xs font-bold text-white truncate">{selectedFile.name}</span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                  <button type="button" onClick={() => setSelectedFile(null)} className="p-1.5 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" title="Remove attachment">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              )}

              <div className={`flex items-end gap-3 w-full ${isRtl ? 'flex-row-reverse' : ''}`}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-shrink-0 w-11 h-11 bg-[#0B0F19] hover:bg-white/5 text-slate-400 rounded-2xl flex items-center justify-center transition-all border border-white/5"
                  title="Attach file"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={e => {
                    const file = e.target.files[0];
                    if (file && file.size > 5 * 1024 * 1024) {
                      alert(t('admin.msg_file_large') || 'File is too large. Maximum size is 5MB.');
                      e.target.value = '';
                      return;
                    }
                    if (file) setSelectedFile(file);
                    e.target.value = '';
                  }}
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx"
                />

                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend(e);
                      }
                    }}
                    placeholder={t('admin.msg_placeholder') || 'Type a reply… (Enter to send, Shift+Enter for new line)'}
                    rows={1}
                    className={`w-full px-4 py-3 bg-[#0B0F19] border border-white/5 rounded-2xl text-sm text-white
                      focus:outline-none focus:border-red-500/30
                      resize-none transition-all leading-relaxed custom-scrollbar ${isRtl ? 'text-right' : 'text-left'}`}
                    style={{ minHeight: '48px', maxHeight: '160px' }}
                    onInput={e => {
                      e.target.style.height = 'auto';
                      e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={sending || (!replyText.trim() && !selectedFile)}
                  className={`flex-shrink-0 h-11 bg-red-600 text-white rounded-2xl flex items-center justify-center
                    shadow-lg shadow-red-600/20 hover:bg-red-700 active:scale-95 transition-all
                    disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100
                    ${sending ? 'px-4' : 'w-11'}`}
                  title="Send reply"
                >
                  {sending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                      <span className="text-xs font-bold uppercase tracking-wider">{t('admin.msg_sending') || 'Sending...'}</span>
                    </>
                  ) : (
                    <svg className={`w-4 h-4 ${isRtl ? 'rotate-180 -translate-x-0.5' : 'translate-x-0.5'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default Messages;


