import axios from 'axios';
import { create } from 'zustand';

type Message = {
  question: string;
  answer: string;
  sources?: string[];
};

type Persona = {
  id: string;
  name: string;
  description: string;
};

type ChatStore = {
  messages: Message[];
  loading: boolean;
  personas: Persona[];
  selectedPersonaId: string | null;
  fetchPersonas: () => Promise<void>;
  setSelectedPersonaId: (id: string) => void;
  sendMessage: (question: string) => Promise<void>;
};

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  loading: false,
  personas: [],
  selectedPersonaId: null,

  fetchPersonas: async () => {
    try {
      const response = await axios.get<Persona[]>(`${process.env.NEXT_PUBLIC_ZEPHYR_URL}personas`);
      set({ personas: response.data });
      // Select the first persona by default if available
      if (response.data.length > 0 && !get().selectedPersonaId) {
        set({ selectedPersonaId: response.data[0].id });
      }
    } catch (error) {
      console.error('Error fetching personas:', error);
    }
  },

  setSelectedPersonaId: (id: string) => {
    set({ selectedPersonaId: id });
  },

  sendMessage: async (question: string) => {
    const { selectedPersonaId, messages } = get();

    if (!selectedPersonaId) {
      console.error('No persona selected');
      return;
    }

    const userMessage: Message = {
      question,
      answer: '',
    };
    set({ messages: [...messages, userMessage], loading: true });

    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_ZEPHYR_URL}ask`, {
        personaId: selectedPersonaId,
        question,
      });

      const updatedMessages = [...get().messages];
      const lastMessageIndex = updatedMessages.length - 1;
      updatedMessages[lastMessageIndex] = {
        question,
        answer: response.data.answer,
        sources: response.data.sources,
      };

      set({ messages: updatedMessages, loading: false });
    } catch (error) {
      console.error('Error sending message:', error);
      const updatedMessages = [...get().messages];
      const lastMessageIndex = updatedMessages.length - 1;
      updatedMessages[lastMessageIndex] = {
        question,
        answer: 'Failed to get response from the server. Please try again.',
      };
      set({ messages: updatedMessages, loading: false });
    }
  },
}));

export default useChatStore;
