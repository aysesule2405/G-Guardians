/**
 * Audio helper for HackHERS Guardian
 */

export const playAudio = async (audioData: Blob | { audioUrl: string }) => {
  let url: string;

  if (audioData instanceof Blob) {
    url = URL.createObjectURL(audioData);
  } else if (typeof audioData === 'object' && 'audioUrl' in audioData) {
    url = audioData.audioUrl;
  } else {
    throw new Error('Invalid audio data format');
  }

  const audio = new Audio(url);
  
  return new Promise<void>((resolve, reject) => {
    audio.onended = () => {
      if (audioData instanceof Blob) {
        URL.revokeObjectURL(url);
      }
      resolve();
    };
    audio.onerror = (e) => {
      if (audioData instanceof Blob) {
        URL.revokeObjectURL(url);
      }
      reject(e);
    };
    audio.play().catch(reject);
  });
};
