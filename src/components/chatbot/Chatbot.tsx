/**
 * Chatbot flottant — Assistant intelligent du Collège Sully
 * Bouton fixe en bas à droite, panel de chat qui s'ouvre/ferme.
 */
import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Bot, User, Trash2 } from 'lucide-react';
import { chatApi, type ChatMessage } from '../../services/api/chatApi';
import { useSchoolYear } from '../../contexts/SchoolYearContext';

// Questions suggérées pour démarrer rapidement
const SUGGESTIONS = [
  'Combien d\'élèves sont inscrits cette année ?',
  'Quels élèves sont en 3EME ?',
  'Quelle est la moyenne de la classe 6EME au trimestre 1 ?',
  'Donne-moi les infos de contact des parents de [nom élève]',
];

export function Chatbot() {
  const { currentYear } = useSchoolYear();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll vers le bas à chaque nouveau message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Focus sur l'input quand le panel s'ouvre
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    setInput('');

    const userMsg: ChatMessage = { role: 'user', content };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setLoading(true);

    try {
      const reply = await chatApi.send(updated, currentYear);
      setMessages([...updated, { role: 'assistant', content: reply }]);
    } catch (err) {
      const msg = err instanceof Error && err.message === 'timeout'
        ? 'Ollama met trop de temps à répondre. Réessayez dans un instant ou vérifiez que le modèle est chargé.'
        : 'Impossible de contacter le serveur. Vérifiez qu\'Ollama est en cours d\'exécution.';
      setMessages([...updated, { role: 'assistant', content: msg }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => setMessages([]);

  return (
    <>
      {/* ── Bouton flottant ── */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 ${
          open ? 'bg-gray-700 hover:bg-gray-800' : 'bg-indigo-600 hover:bg-indigo-700'
        }`}
        title="Assistant IA"
      >
        {open ? <X size={22} className="text-white" /> : <MessageCircle size={24} className="text-white" />}
        {!open && messages.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full text-white text-xs flex items-center justify-center font-bold">
            {messages.filter(m => m.role === 'assistant').length}
          </span>
        )}
      </button>

      {/* ── Panel de chat ── */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200"
          style={{ height: '520px' }}
        >
          {/* En-tête */}
          <div className="bg-indigo-700 px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                <Bot size={18} className="text-white" />
              </div>
              <div>
                <div className="text-white font-semibold text-sm">Assistant Sully</div>
                <div className="text-indigo-300 text-xs">{currentYear}</div>
              </div>
            </div>
            {messages.length > 0 && (
              <button onClick={clearChat} className="p-1.5 text-indigo-300 hover:text-white hover:bg-indigo-600 rounded-lg" title="Effacer la conversation">
                <Trash2 size={15} />
              </button>
            )}
          </div>

          {/* Corps — messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.length === 0 ? (
              <div className="space-y-4">
                <div className="flex items-start gap-2">
                  <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot size={14} className="text-indigo-600" />
                  </div>
                  <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-gray-700 shadow-sm max-w-[85%]">
                    Bonjour ! Je suis l'assistant du Collège Sully. Je peux vous aider à consulter les élèves, les notes et les statistiques de classe.
                  </div>
                </div>
                <div className="pl-9 space-y-2">
                  <p className="text-xs text-gray-400 font-medium">Essayez par exemple :</p>
                  {SUGGESTIONS.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(s)}
                      className="block w-full text-left text-xs px-3 py-2 bg-white border border-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-50 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className={`flex items-start gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.role === 'user' ? 'bg-indigo-600' : 'bg-indigo-100'
                  }`}>
                    {msg.role === 'user'
                      ? <User size={14} className="text-white" />
                      : <Bot size={14} className="text-indigo-600" />
                    }
                  </div>
                  <div className={`px-4 py-3 text-sm shadow-sm max-w-[85%] whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-sm'
                      : 'bg-white border border-gray-200 text-gray-700 rounded-2xl rounded-tl-sm'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))
            )}

            {/* Indicateur de chargement */}
            {loading && (
              <div className="flex items-start gap-2">
                <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot size={14} className="text-indigo-600" />
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                  <Loader2 size={16} className="text-indigo-500 animate-spin" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Zone de saisie */}
          <div className="px-3 py-3 border-t border-gray-200 bg-white flex-shrink-0">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Posez votre question…"
                rows={1}
                disabled={loading}
                className="flex-1 resize-none border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none disabled:opacity-50"
                style={{ maxHeight: '100px', overflowY: 'auto' }}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className="w-9 h-9 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 transition-colors"
              >
                <Send size={15} />
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1.5 text-center">Entrée pour envoyer · Maj+Entrée pour nouvelle ligne</p>
          </div>
        </div>
      )}
    </>
  );
}
