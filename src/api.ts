/**
 * API module for HackHERS Guardian
 */

export interface AssessResponse {
  riskLevel: 'Low' | 'Medium' | 'High';
  guardianMessage: string;
}

export const assessRisk = async (scenario: string): Promise<AssessResponse> => {
  const response = await fetch('/assess', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ scenario }),
  });

  if (!response.ok) {
    throw new Error('Failed to assess risk. Please try again.');
  }

  return response.json();
};

export const getTTSAudio = async (text: string): Promise<Blob | { audioUrl: string }> => {
  const response = await fetch('/tts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate voice. Please try again.');
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  } else {
    return response.blob();
  }
};

export interface Track {
  id: number;
  title: string;
  movie: string;
  url: string;
}

export interface ChatMessage {
  role: 'user' | 'bot';
  text: string;
}

export const getMusicTracks = async (): Promise<Track[]> => {
  const response = await fetch('/api/music');
  if (!response.ok) throw new Error('Failed to fetch music');
  return response.json();
};

export const sendChatMessage = async (character: string, message: string, history: ChatMessage[]): Promise<string> => {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ character, message, history }),
  });

  if (!response.ok) throw new Error('Failed to chat with character');
  const data = await response.json();
  return data.text;
};

export interface Contact {
  id: number;
  name: string;
  phone: string;
  relation: string;
}

export const getContacts = async (): Promise<Contact[]> => {
  const response = await fetch('/api/contacts');
  if (!response.ok) throw new Error('Failed to fetch contacts');
  return response.json();
};

export const addContact = async (contact: Omit<Contact, 'id'>): Promise<Contact> => {
  const response = await fetch('/api/contacts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(contact),
  });
  if (!response.ok) throw new Error('Failed to add contact');
  return response.json();
};

export const deleteContact = async (id: number): Promise<void> => {
  const response = await fetch(`/api/contacts/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete contact');
};

export const sendEmergencyAlert = async (location: { lat: number; lng: number }, contacts: Contact[], message: string): Promise<void> => {
  const response = await fetch('/api/alert', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ location, contacts, message }),
  });
  if (!response.ok) throw new Error('Failed to send alert');
};

export const getElevenLabsTTS = async (text: string, voiceId: string): Promise<Blob> => {
  const response = await fetch('/api/tts/elevenlabs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voiceId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate voice');
  }

  return response.blob();
};
