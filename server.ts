import express from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Ghibli Characters for Chat
const GHIBLI_CHARACTERS = {
  totoro: {
    name: "Totoro",
    voiceId: "pNInz6obpg8nEmeWscDJ", // Will be used for sound effects logic
    instruction: "You are Totoro. You communicate with gentle, warm, and comforting words. Use soft forest sounds like *soft growl*. You make the user feel safe and grounded. Since you don't speak in the movies, keep your responses short and evocative of nature."
  },
  noface: {
    name: "No-Face",
    voiceId: "onwK4e9ZLuTAKqWW03F9", // Will be used for sound effects logic
    instruction: "You are No-Face from Spirited Away. You are shy, misunderstood, and deeply lonely but kind. You speak in soft, hesitant sentences. You often offer small gifts like *offers a gold nugget*. Since you don't speak much, use sounds like 'Ah... ah...' and focus on gestures."
  },
  eboshi: {
    name: "Lady Eboshi",
    voiceId: "MF3mGyEYCl7XYW7Jscj5", 
    instruction: "You are Lady Eboshi from Princess Mononoke. You are a strong, pragmatic, and protective leader. You speak with authority but deep care for your people. You offer firm, realistic safety advice."
  },
  howl: {
    name: "Howl&Spohie",
    voiceId: "EXAVITQu4vr4xnSDxMaL", 
    instruction: "You are Howl Jenkins Pendragon. You are charismatic, a bit vain, but deeply caring and protective. You speak with elegance and offer magical, reassuring support. You might mention your moving castle or Calcifer."
  },
  chihiro: {
    name: "Chihiro&Haku",
    voiceId: "AZnzlk1XhkDvOVfIUCvO", 
    instruction: "You are Chihiro from Spirited Away. You are resilient, hardworking, and empathetic. You understand fear but choose to be brave anyway. You offer encouraging words for those facing new or scary situations."
  }
};

import Database from "better-sqlite3";

const db = new Database("safety.db");

// Initialize DB
db.exec(`
  CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    relation TEXT
  )
`);

// --- API Endpoints ---

// Emergency Contacts
app.get("/api/contacts", (req, res) => {
  const contacts = db.prepare("SELECT * FROM contacts").all();
  res.json(contacts);
});

app.post("/api/contacts", (req, res) => {
  const { name, phone, relation } = req.body;
  const info = db.prepare("INSERT INTO contacts (name, phone, relation) VALUES (?, ?, ?)").run(name, phone, relation);
  res.json({ id: info.lastInsertRowid, name, phone, relation });
});

app.delete("/api/contacts/:id", (req, res) => {
  db.prepare("DELETE FROM contacts WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

// Emergency Alert
app.post("/api/alert", async (req, res) => {
  const { location, contacts, message } = req.body;
  // In a real app, this would send SMS/Email via Twilio/SendGrid
  console.log(`[ALERT] Sending to ${contacts.length} contacts: ${message}`);
  console.log(`[LOCATION] https://www.google.com/maps?q=${location.lat},${location.lng}`);
  
  res.json({ success: true, message: "Alerts sent to your guardians." });
});

// 1. Dynamic Risk Assessment using Gemini
app.post("/assess", async (req, res) => {
  const { scenario } = req.body;
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Assess the safety risk for a woman in this scenario: "${scenario}". 
      Return a JSON object with:
      - "riskLevel": "Low", "Medium", or "High"
      - "guardianMessage": A short, comforting, Ghibli-style message (max 2 sentences) offering specific advice for this scenario.`,
      config: { responseMimeType: "application/json" }
    });
    res.json(JSON.parse(response.text));
  } catch (error) {
    res.json({ riskLevel: 'Low', guardianMessage: 'I am here with you. Walk mindfully and trust your heart.' });
  }
});

// 2. Real TTS using Gemini 2.5 Flash TTS
app.post("/tts", async (req, res) => {
  const { text } = req.body;
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' } 
          }
        }
      }
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      const buffer = Buffer.from(base64Audio, 'base64');
      res.setHeader('Content-Type', 'audio/mpeg');
      res.send(buffer);
    } else {
      throw new Error("Audio generation failed");
    }
  } catch (error) {
    console.error("TTS Error:", error);
    res.status(500).json({ error: "Failed to generate voice." });
  }
});

// 2.1 ElevenLabs TTS Endpoint
app.post("/api/tts/elevenlabs", async (req, res) => {
  const { text, voiceId } = req.body;
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey || apiKey === "YOUR_ELEVENLABS_API_KEY") {
    return res.status(500).json({ error: "ElevenLabs API Key not configured." });
  }

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail?.message || "ElevenLabs API error");
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    res.setHeader("Content-Type", "audio/mpeg");
    res.send(buffer);
  } catch (error) {
    console.error("ElevenLabs Error:", error);
    res.status(500).json({ error: "Failed to generate ElevenLabs voice." });
  }
});

// 3. Music Playlist
app.get("/api/music", (req, res) => {
  const tracks = [
    { id: 1, title: "Path of the Wind", movie: "My Neighbor Totoro", url: "/music/path_of_the_wind.mp3" },
    { id: 2, title: "A Town with an Ocean View", movie: "Kiki's Delivery Service", url: "/music/ocean_view.mp3" },
    { id: 3, title: "Merry-Go-Round of Life", movie: "Howl's Moving Castle", url: "/music/merry_go_round.mp3" },
    { id: 4, title: "One Summer's Day", movie: "Spirited Away", url: "/music/one_summers_day.mp3" },
    { id: 5, title: "The Legend of Ashitaka", movie: "Princess Mononoke", url: "/music/legend_of_ashitaka.mp3" },
    { id: 6, title: "Always with Me", movie: "Spirited Away", url: "/music/always_with_me.mp3" }
  ];
  res.json(tracks);
});

// 4. Character Chat
app.post("/api/chat", async (req, res) => {
  const { character, message, history } = req.body;
  const charConfig = GHIBLI_CHARACTERS[character as keyof typeof GHIBLI_CHARACTERS] || GHIBLI_CHARACTERS.totoro;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        { role: "user", parts: [{ text: `System Instruction: ${charConfig.instruction}` }] },
        ...history.map((h: any) => ({
          role: h.role === 'user' ? 'user' : 'model',
          parts: [{ text: h.text }]
        })),
        { role: "user", parts: [{ text: message }] }
      ]
    });
    res.json({ text: response.text });
  } catch (error) {
    res.status(500).json({ error: "Chat failed." });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
