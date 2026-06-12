import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { messagesAPI } from '../services/api';

const DashboardContact = ({ user }) => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    fetchMyMessages();
  }, []);

  const fetchMyMessages = async () => {
    try {
      const res = await messagesAPI.getMyMessages();
      setMessages(res.data);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.message.trim()) return;

    setSending(true);
    setStatus(null);
    try {
      await messagesAPI.create({
        ...formData,
        name: user?.name || 'User',
        email: user?.email || 'user@example.com'
      });
      setStatus({ type: 'success', text: 'Message sent successfully!' });
      setFormData({ subject: '', message: '' });
      fetchMyMessages();
    } catch (err) {
      console.error('Failed to send message:', err);
      setStatus({ type: 'error', text: 'Failed to send message. Please try again.' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">{t('dashboard.contactAdmin', t('dashboard.sidebar.contactAdmin'))}</h1>
          <p className="text-slate-400 mt-2">Have a question? We're here to help.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Contact Form */}
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
            Send a New Message
          </h3>
          <div className="bg-[#161821] p-8 rounded-3xl border border-slate-800 shadow-xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              {status && (
                <div className={`p-4 rounded-xl text-sm font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300 ${
                  status.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${status.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                  {status.text}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">{t('contact.subject')}</label>
                <input 
                  type="text" 
                  required
                  value={formData.subject}
                  onChange={e => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full bg-[#1b1e2a] border border-slate-800/50 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 transition-all text-sm font-medium"
                  placeholder={t('contact.subjectPlaceholder')}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">{t('contact.message')}</label>
                <textarea 
                  required
                  rows="5"
                  value={formData.message}
                  onChange={e => setFormData({ ...formData, message: e.target.value })}
                  className="w-full bg-[#1b1e2a] border border-slate-800/50 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 transition-all text-sm font-medium resize-none"
                  placeholder={t('contact.messagePlaceholder')}
                ></textarea>
              </div>
              <button 
                type="submit" 
                disabled={sending}
                className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-sm font-bold transition-all w-full shadow-lg shadow-emerald-900/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {sending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                    {t('contact.sendMessage')}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Message History */}
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="w-1.5 h-6 bg-blue-500 rounded-full"></span>
            My Message History
          </h3>
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4 opacity-50">
                <div className="w-8 h-8 border-2 border-slate-700 border-t-emerald-500 rounded-full animate-spin"></div>
                <p className="text-slate-400 text-sm font-medium">Loading history...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="bg-[#161821] p-12 rounded-3xl border border-slate-800/50 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-slate-800/30 rounded-full flex items-center justify-center mb-4 text-slate-600">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                </div>
                <p className="text-slate-400 font-medium">No messages yet</p>
                <p className="text-slate-600 text-xs mt-1">Start a conversation above.</p>
              </div>
            ) : (
              messages.map(msg => (
                <div key={msg.id} className="bg-[#161821] rounded-3xl border border-slate-800/50 overflow-hidden shadow-sm group hover:border-slate-700 transition-colors">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{new Date(msg.created_at).toLocaleDateString()}</span>
                        <h4 className="text-white font-bold text-sm mt-1">{msg.subject || 'No Subject'}</h4>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        msg.status === 'replied' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        {msg.status || 'Sent'}
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs leading-relaxed line-clamp-3 group-hover:line-clamp-none transition-all">{msg.message}</p>
                    
                    {msg.reply && (
                      <div className="mt-6 pt-6 border-t border-slate-800/50 relative">
                        <div className="absolute top-0 left-6 -translate-y-1/2 px-2 bg-[#161821] text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Admin Response</div>
                        <p className="text-emerald-400/90 text-xs italic leading-relaxed bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/10">{msg.reply}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1f2937; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #374151; }
      `}} />
    </div>
  );
};

export default DashboardContact;
