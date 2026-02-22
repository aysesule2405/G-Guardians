import React, { useState, useEffect } from 'react';
import { Heart, Phone, MapPin, Users, Plus, Trash2, AlertCircle, Activity, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getContacts, addContact, deleteContact, sendEmergencyAlert, Contact } from '../api';

export default function SafetyPassage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', phone: '', relation: '' });
  const [isAlerting, setIsAlerting] = useState(false);
  const [showFakeCall, setShowFakeCall] = useState(false);
  const [vitals, setVitals] = useState({ bpm: 72, stress: 'Normal' });

  useEffect(() => {
    getContacts().then(setContacts).catch(console.error);
  }, []);

  // Simulate Vitals
  useEffect(() => {
    const interval = setInterval(() => {
      setVitals(prev => {
        const change = Math.floor(Math.random() * 5) - 2;
        const newBpm = Math.max(60, Math.min(120, prev.bpm + change));
        let stress = 'Normal';
        if (newBpm > 95) stress = 'Elevated';
        if (newBpm > 110) stress = 'High';
        return { bpm: newBpm, stress };
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContact.name || !newContact.phone) return;
    try {
      const added = await addContact(newContact);
      setContacts([...contacts, added]);
      setNewContact({ name: '', phone: '', relation: '' });
      setShowAddContact(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteContact = async (id: number) => {
    try {
      await deleteContact(id);
      setContacts(contacts.filter(c => c.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const triggerAlert = async () => {
    if (contacts.length === 0) {
      alert("Please add emergency contacts first.");
      return;
    }
    setIsAlerting(true);
    try {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        await sendEmergencyAlert(location, contacts, "Emergency! I need help. My current location is attached.");
        alert("Emergency alert sent to your guardians.");
        setIsAlerting(false);
      }, (err) => {
        console.error(err);
        alert("Could not get location. Alert sent without coordinates.");
        setIsAlerting(false);
      });
    } catch (err) {
      console.error(err);
      setIsAlerting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Vitals Monitor */}
      <div className="glass-card p-6 border-earth-sage/20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-display font-bold flex items-center gap-2 text-earth-deep">
            <Activity className="w-5 h-5 text-earth-moss" />
            Vital Monitor
          </h3>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
            vitals.stress === 'Normal' ? 'bg-earth-sage/20 text-earth-moss' :
            vitals.stress === 'Elevated' ? 'bg-earth-clay/20 text-earth-clay' : 'bg-rose-100 text-rose-700'
          }`}>
            {vitals.stress}
          </span>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 60 / vitals.bpm, repeat: Infinity }}
            >
              <Heart className="w-8 h-8 text-rose-500 fill-rose-500" />
            </motion.div>
            <div className="text-2xl font-display font-bold text-earth-deep">{vitals.bpm} <span className="text-xs text-earth-sage font-sans">BPM</span></div>
          </div>
          <div className="flex-1 h-2 bg-earth-sage/10 rounded-full overflow-hidden">
            <motion.div 
              className={`h-full transition-all duration-1000 ${
                vitals.stress === 'Normal' ? 'bg-earth-sage' :
                vitals.stress === 'Elevated' ? 'bg-earth-clay' : 'bg-rose-500'
              }`}
              animate={{ width: `${(vitals.bpm / 120) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={() => setShowFakeCall(true)}
          className="glass-card p-4 flex flex-col items-center gap-2 hover:bg-earth-cream/50 transition-all group"
        >
          <div className="w-10 h-10 bg-earth-sage/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
            <Phone className="w-5 h-5 text-earth-moss" />
          </div>
          <span className="text-xs font-bold text-earth-moss uppercase tracking-wider">Fake Call</span>
        </button>
        <button 
          onClick={triggerAlert}
          disabled={isAlerting}
          className="glass-card p-4 flex flex-col items-center gap-2 hover:bg-rose-50 transition-all group border-rose-100"
        >
          <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
            <ShieldAlert className={`w-5 h-5 text-rose-700 ${isAlerting ? 'animate-ping' : ''}`} />
          </div>
          <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">SOS Alert</span>
        </button>
      </div>

      {/* Emergency Contacts */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-display font-bold flex items-center gap-2 text-earth-deep">
            <Users className="w-5 h-5 text-earth-moss" />
            Guardians
          </h3>
          <button 
            onClick={() => setShowAddContact(!showAddContact)}
            className="p-1.5 bg-earth-sage/10 text-earth-moss rounded-lg hover:bg-earth-sage/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <AnimatePresence>
          {showAddContact && (
            <motion.form 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              onSubmit={handleAddContact}
              className="space-y-3 mb-4 overflow-hidden"
            >
              <input 
                type="text" 
                placeholder="Name" 
                value={newContact.name}
                onChange={e => setNewContact({...newContact, name: e.target.value})}
                className="w-full bg-white/80 border border-earth-sage/20 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-earth-sage/30"
              />
              <div className="grid grid-cols-2 gap-2">
                <input 
                  type="text" 
                  placeholder="Phone" 
                  value={newContact.phone}
                  onChange={e => setNewContact({...newContact, phone: e.target.value})}
                  className="w-full bg-white/80 border border-earth-sage/20 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-earth-sage/30"
                />
                <input 
                  type="text" 
                  placeholder="Relation" 
                  value={newContact.relation}
                  onChange={e => setNewContact({...newContact, relation: e.target.value})}
                  className="w-full bg-white/80 border border-earth-sage/20 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-earth-sage/30"
                />
              </div>
              <button type="submit" className="w-full primary-button py-2 text-sm">Add Guardian</button>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="space-y-2">
          {contacts.length === 0 ? (
            <p className="text-xs text-earth-sage italic text-center py-4">No guardians added yet.</p>
          ) : (
            contacts.map(contact => (
              <div key={contact.id} className="flex items-center justify-between p-3 bg-white/60 rounded-2xl border border-earth-sage/10">
                <div>
                  <p className="text-sm font-bold text-earth-deep">{contact.name}</p>
                  <p className="text-[10px] text-earth-sage font-medium">{contact.relation} • {contact.phone}</p>
                </div>
                <button 
                  onClick={() => handleDeleteContact(contact.id)}
                  className="p-2 text-earth-sage hover:text-rose-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Fake Call Overlay */}
      <AnimatePresence>
        {showFakeCall && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-between py-20 px-10 text-white"
          >
            <div className="text-center space-y-4">
              <div className="w-32 h-32 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-16 h-16 text-slate-400" />
              </div>
              <h2 className="text-3xl font-display font-bold">Dad</h2>
              <p className="text-slate-400 animate-pulse">Incoming Call...</p>
            </div>

            <div className="flex gap-20">
              <div className="flex flex-col items-center gap-3">
                <button 
                  onClick={() => setShowFakeCall(false)}
                  className="w-20 h-20 bg-rose-700 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                >
                  <Phone className="w-8 h-8 rotate-[135deg]" />
                </button>
                <span className="text-sm font-medium">Decline</span>
              </div>
              <div className="flex flex-col items-center gap-3">
                <button 
                  onClick={() => setShowFakeCall(false)}
                  className="w-20 h-20 bg-earth-moss rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                >
                  <Phone className="w-8 h-8" />
                </button>
                <span className="text-sm font-medium">Accept</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
