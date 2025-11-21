'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Form } from '@/components/ui/form';
import { cn } from '@/lib/utils';
import { useChatStore } from '@/store/chatStore';

// Answer Reveal Component with animation
const AnswerReveal = ({ answer }: { answer: string }) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;

  // Split by newlines first to preserve paragraph structure
  const paragraphs = answer.split('\n');
  let wordIndex = 0;

  // Calculate total words for delay
  const totalWords = answer.split(' ').length;
  let delayPerWord = 0.05;

  if (totalWords > 200) {
    const totalDuration = 5; // in seconds
    delayPerWord = totalDuration / totalWords;
  }

  return (
    <div className="text-foreground/90 text-sm leading-relaxed whitespace-pre-wrap">
      {paragraphs.map((paragraph, pIndex) => {
        const words = paragraph.split(' ');
        return (
          <span key={pIndex}>
            {words.map((word, wIndex) => {
              const isURL = word.match(urlRegex);
              const currentIndex = wordIndex++;
              return (
                <motion.span
                  key={`${pIndex}-${wIndex}`}
                  className="inline-block"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: currentIndex * delayPerWord, duration: 0.3 }}
                >
                  {isURL ? (
                    <a
                      href={word}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-accent underline"
                    >
                      {word}
                    </a>
                  ) : (
                    word
                  )}
                  &nbsp;
                </motion.span>
              );
            })}
            {pIndex < paragraphs.length - 1 && '\n'}
          </span>
        );
      })}
    </div>
  );
};

// Simple Card Component for Suggestions
const SuggestionCard = ({ title, onClick }: { title: string; onClick: () => void }) => (
  <motion.button
    whileHover={{ scale: 1.02, y: -2 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className="group hover:border-accent/50 relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-4 text-left transition-all hover:bg-white/10 hover:shadow-[0_0_20px_-5px_var(--accent)]"
  >
    <div className="relative z-10 flex items-center justify-between gap-2">
      <span className="text-foreground/90 group-hover:text-primary-foreground text-sm font-medium transition-colors">
        {title}
      </span>
      <Sparkles className="text-primary h-4 w-4 opacity-0 transition-all group-hover:opacity-100" />
    </div>
    <div className="from-primary/10 absolute inset-0 -z-10 bg-gradient-to-br to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
  </motion.button>
);

export default function Home() {
  const {
    sendMessage,
    fetchPersonas,
    loading,
    personas,
    selectedPersonaId,
    setSelectedPersonaId,
    messages,
  } = useChatStore();

  const [isPersonaOpen, setIsPersonaOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const formSchema = z.object({
    question: z.string().min(1, { message: 'Question is required' }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      question: '',
    },
  });

  const { handleSubmit, watch, setValue } = form;
  const questionValue = watch('question');

  console.log('Current question value:', questionValue);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (!selectedPersonaId && personas.length > 0) {
      setSelectedPersonaId(personas[0].id);
    }
    console.log('Submitting question:', data.question);

    await sendMessage(data.question);
    setValue('question', '');

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  useEffect(() => {
    fetchPersonas();
  }, [fetchPersonas]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [questionValue]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (loading) return;
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(onSubmit)();
    }
  };

  const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    handleSubmit(onSubmit)();
  };

  const selectedPersona = personas.find((p) => p.id === selectedPersonaId);

  return (
    <Form {...form}>
      <div className="text-foreground selection:bg-primary/30 flex min-h-dvh flex-col bg-[url('/images/texture.png')] bg-cover bg-fixed bg-center bg-no-repeat font-sans">
        {/* Header */}
        <header className="bg-background/60 sticky top-0 z-50 border-b border-white/5 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <div className="from-primary to-secondary shadow-primary/20 flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br shadow-lg">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="from-primary via-accent to-primary animate-gradient bg-gradient-to-r bg-[length:200%_auto] bg-clip-text text-xl font-bold text-transparent">
                SageSearch
              </span>
            </div>

            {/* Custom Persona Selector */}
            <div className="relative">
              <button
                onClick={() => setIsPersonaOpen(!isPersonaOpen)}
                className="hover:border-primary/30 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium transition-all hover:bg-white/10 active:scale-95"
              >
                {selectedPersona ? (
                  <>
                    <span className="text-primary">{selectedPersona.name}</span>
                    <span className="text-muted-foreground hidden text-xs sm:inline-block">
                      | {selectedPersona.description.substring(0, 20)}...
                    </span>
                  </>
                ) : (
                  <span className="text-muted-foreground">Select Persona</span>
                )}
                <ChevronDown
                  className={cn(
                    'text-muted-foreground h-4 w-4 transition-transform',
                    isPersonaOpen && 'rotate-180'
                  )}
                />
              </button>

              <AnimatePresence>
                {isPersonaOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="bg-background/80 absolute top-full right-0 mt-2 w-72 overflow-hidden rounded-2xl border border-white/10 p-2 shadow-2xl ring-1 ring-black/5 backdrop-blur-xl"
                  >
                    <div className="space-y-1">
                      {personas.map((persona) => (
                        <button
                          key={persona.id}
                          onClick={() => {
                            setSelectedPersonaId(persona.id);
                            setIsPersonaOpen(false);
                          }}
                          className={cn(
                            'flex w-full flex-col gap-1 rounded-xl px-3 py-2 text-left transition-colors hover:bg-white/5',
                            selectedPersonaId === persona.id && 'bg-primary/10'
                          )}
                        >
                          <span
                            className={cn(
                              'text-sm font-medium',
                              selectedPersonaId === persona.id ? 'text-primary' : 'text-foreground'
                            )}
                          >
                            {persona.name}
                          </span>
                          <span className="text-muted-foreground line-clamp-1 text-xs">
                            {persona.description}
                          </span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto pt-4 pb-32">
          <div className="mx-auto max-w-3xl px-4">
            {messages.length === 0 ? (
              // Empty State
              <div className="flex min-h-[60vh] flex-col items-center justify-center gap-8 text-center">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-4"
                >
                  <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
                    <span className="text-muted-foreground/50 mb-2 block text-2xl font-normal sm:text-3xl">
                      Welcome to
                    </span>
                    <span className="from-foreground to-foreground/50 bg-gradient-to-b bg-clip-text text-transparent">
                      SageSearch
                    </span>
                  </h1>
                  <p className="text-muted-foreground mx-auto max-w-md">
                    Explore wisdom from great minds. Select a persona and start your journey.
                  </p>
                </motion.div>

                {/* Suggestion Grid */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2"
                >
                  {[
                    'Tell me a joke',
                    'What is the meaning of life?',
                    'How to find inner peace?',
                    'Explain quantum physics simply',
                  ].map((suggestion, i) => (
                    <SuggestionCard
                      key={i}
                      title={suggestion}
                      onClick={async () => {
                        if (!selectedPersonaId && personas.length > 0) {
                          setSelectedPersonaId(personas[0].id);
                        }
                        await sendMessage(suggestion);
                      }}
                    />
                  ))}
                </motion.div>
              </div>
            ) : (
              // Chat Messages
              <div className="space-y-6 py-4">
                {messages.map((msg, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      'flex gap-4',
                      msg.answer ? 'flex-col' : 'justify-end' // User message alignment
                    )}
                  >
                    {/* User Message */}
                    <div className="flex justify-end">
                      <div className="from-primary to-accent shadow-primary/5 max-w-[80%] rounded-2xl rounded-tr-sm bg-gradient-to-br px-5 py-3 text-white shadow-lg">
                        <p className="text-sm leading-relaxed">{msg.question}</p>
                      </div>
                    </div>

                    {/* Bot Response */}
                    {msg.answer && (
                      <div className="flex gap-4">
                        <div className="relative flex h-8 w-8 shrink-0 items-center justify-center">
                          {loading && idx === messages.length - 1 ? (
                            <motion.div
                              className="from-primary to-secondary shadow-primary/20 flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br shadow-lg"
                              animate={{ rotate: 360 }}
                              transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                            >
                              <Sparkles className="h-4 w-4 text-white" />
                            </motion.div>
                          ) : (
                            <div className="from-primary to-secondary shadow-primary/20 flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br shadow-lg">
                              <Sparkles className="h-4 w-4 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="rounded-2xl rounded-tl-sm border border-white/5 bg-white/5 px-5 py-4 backdrop-blur-md">
                            <AnswerReveal answer={msg.answer} />
                          </div>
                          {/* Sources (if any) */}
                          {msg.sources && msg.sources.length > 0 && (
                            <div className="flex flex-wrap gap-2 pl-2">
                              {msg.sources.map((source, i) => (
                                <span
                                  key={i}
                                  className="text-muted-foreground hover:text-primary inline-flex items-center rounded-full border border-white/5 bg-white/5 px-2.5 py-0.5 text-xs font-medium transition-colors hover:bg-white/10"
                                >
                                  {source}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}

                {/* Loading Indicator */}
                {loading && messages[messages.length - 1]?.answer === '' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex gap-4"
                  >
                    <motion.div
                      className="from-primary to-secondary shadow-primary/20 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br shadow-lg"
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                    >
                      <Sparkles className="h-4 w-4 text-white" />
                    </motion.div>
                    <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm border border-white/5 bg-white/5 px-4 py-3">
                      <div className="bg-primary/50 h-2 w-2 animate-bounce rounded-full [animation-delay:-0.3s]" />
                      <div className="bg-primary/50 h-2 w-2 animate-bounce rounded-full [animation-delay:-0.15s]" />
                      <div className="bg-primary/50 h-2 w-2 animate-bounce rounded-full" />
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </main>

        {/* Floating Input Area */}
        <div className="from-background via-background/80 fixed right-0 bottom-0 left-0 z-50 bg-gradient-to-t to-transparent p-4 pt-10 pb-6">
          <div className="mx-auto max-w-3xl">
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="focus-within:border-primary/50 focus-within:ring-primary/50 relative flex items-end gap-2 rounded-3xl border border-white/10 bg-white/5 p-2 shadow-2xl shadow-black/50 backdrop-blur-xl transition-all focus-within:bg-white/10 focus-within:ring-1"
            >
              <textarea
                value={questionValue || ''}
                onChange={(e) => setValue('question', e.target.value)}
                ref={textareaRef}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything..."
                rows={1}
                disabled={loading}
                className="text-foreground placeholder:text-muted-foreground vibrant-scrollbar max-h-32 min-h-[44px] w-full resize-none bg-transparent px-4 py-3 text-sm focus:outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                onClick={handleButtonClick}
                disabled={loading || !questionValue?.trim()}
                className="from-primary to-accent text-primary-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br transition-all hover:shadow-[0_0_15px_-3px_var(--accent)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
            <p className="text-muted-foreground/50 mt-2 text-center text-xs">
              AI can make mistakes. Please verify important information.
            </p>
          </div>
        </div>
      </div>
    </Form>
  );
}
