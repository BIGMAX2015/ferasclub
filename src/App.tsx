import React, { useState, useEffect } from 'react';
import { 
  Shield, Users, Plus, Share2, Check, Trash2, 
  Clock, MapPin
} from 'lucide-react';

interface PlayerSlot {
  id: number;
  name: string;
  confirmed: boolean;
  timeInfo?: string;
}

interface Match {
  id: string;
  title: string;
  game: string;
  mapName: string;
  date: string;
  time: string;
  players: PlayerSlot[];
  observer: PlayerSlot;
  status: 'open' | 'full' | 'in_progress' | 'finished';
}

const MAP_OPTIONS = [
  "Porto Skell",
  "Acampamento",
  "Bunker",
  "Porto Abandonado",
  "Canteiro de Obras",
  "Vale Esquecido",
  "Pátio de Cargas"
];

export default function App() {
  const [matches, setMatches] = useState<Match[]>(() => {
    const saved = localStorage.getItem('feraclub_matches_v2');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [
      {
        id: '1',
        title: 'Persona Breakpoint',
        game: 'Ghost Recon Breakpoint',
        mapName: 'Porto Skell',
        date: 'Hoje',
        time: '21HS',
        status: 'open',
        players: [
          { id: 1, name: 'MalVado', confirmed: true },
          { id: 2, name: 'Nuke', confirmed: true },
          { id: 3, name: 'Cássio', confirmed: true },
          { id: 4, name: 'Donn', confirmed: true },
          { id: 5, name: 'Tchork', confirmed: true },
          { id: 6, name: '', confirmed: false },
          { id: 7, name: '', confirmed: false },
          { id: 8, name: '', confirmed: false }
        ],
        observer: { id: 9, name: 'FERA Malvado', confirmed: true, timeInfo: '(lá pras 22:15hs)' }
      }
    ];
  });

  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState<{ matchId: string; slotId: number; isObserver: boolean } | null>(null);
  const [tempName, setTempName] = useState('');
  const [copiedMatchId, setCopiedMatchId] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState('Persona Breakpoint');
  const [newMap, setNewMap] = useState(MAP_OPTIONS[0]);
  const [newTime, setNewTime] = useState('21HS');

  useEffect(() => {
    localStorage.setItem('feraclub_matches_v2', JSON.stringify(matches));
  }, [matches]);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === 'feras123' || adminPassword === 'admin') {
      setIsAdmin(true);
      setShowAdminModal(false);
      setAdminPassword('');
    } else {
      alert('Senha incorreta! Tente novamente.');
    }
  };

  const handleJoinSlot = (matchId: string, slotId: number, isObserver: boolean = false) => {
    const match = matches.find(m => m.id === matchId);
    if (!match) return;
    
    const currentName = isObserver ? match.observer.name : match.players.find(p => p.id === slotId)?.name || '';
    setEditingSlot({ matchId, slotId, isObserver });
    setTempName(currentName);
  };

  const savePlayerName = () => {
    if (!editingSlot) return;
    const { matchId, slotId, isObserver } = editingSlot;

    setMatches(prev => prev.map(m => {
      if (m.id !== matchId) return m;
      
      if (isObserver) {
        return {
          ...m,
          observer: {
            ...m.observer,
            name: tempName.trim(),
            confirmed: tempName.trim().length > 0
          }
        };
      } else {
        const updatedPlayers = m.players.map(p => {
          if (p.id === slotId) {
            return {
              ...p,
              name: tempName.trim(),
              confirmed: tempName.trim().length > 0
            };
          }
          return p;
        });
        
        const confirmedCount = updatedPlayers.filter(p => p.confirmed).length;
        const newStatus = confirmedCount >= 8 ? 'full' : 'open';

        return {
          ...m,
          players: updatedPlayers,
          status: newStatus
        };
      }
    }));

    setEditingSlot(null);
    setTempName('');
  };

  const createMatch = (e: React.FormEvent) => {
    e.preventDefault();
    const newMatch: Match = {
      id: Date.now().toString(),
      title: newTitle,
      game: 'Ghost Recon Breakpoint',
      mapName: newMap,
      date: 'Hoje',
      time: newTime,
      status: 'open',
      players: Array.from({ length: 8 }, (_, i) => ({
        id: i + 1,
        name: '',
        confirmed: false
      })),
      observer: { id: 9, name: '', confirmed: false }
    };

    setMatches([newMatch, ...matches]);
    setShowCreateModal(false);
    setNewTitle('Persona Breakpoint');
  };

  const deleteMatch = (matchId: string) => {
    if (confirm('Tens a certeza que queres apagar esta operação?')) {
      setMatches(prev => prev.filter(m => m.id !== matchId));
    }
  };

  const copyWhatsAppList = (match: Match) => {
    const filledPlayers = match.players.map(p => `${p.id} ${p.name ? p.name + '✅' : ''}`).join('\n');
    const obsText = match.observer.name ? `\nObservador\n9 ${match.observer.name}✅ ${match.observer.timeInfo || ''}` : '';
    
    const text = `🔥 ${match.title} 🔥\na PARTIR ✨ ${match.time} ✨\n🗺️ Mapa: ${match.mapName}\n\n${filledPlayers}${obsText}\n\n✨💥🔥 É FERA! 🔥💥✨`;

    navigator.clipboard.writeText(text);
    setCopiedMatchId(match.id);
    setTimeout(() => setCopiedMatchId(null), 2500);
  };

  const activeMatches = matches.filter(m => m.status !== 'finished');
  const confirmedCount = (match: Match) => match.players.filter(p => p.confirmed).length;

  return (
    <div className="min-h-screen bg-[#0d0d0f] text-gray-100 font-sans pb-12">
      <header className="sticky top-0 z-30 bg-[#121216]/95 backdrop-blur border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="bg-orange-600/20 p-2 rounded-lg border border-orange-500/40 text-orange-500">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-wider text-white flex items-center gap-1.5">
              FERACLUB
              <span className="text-xs bg-orange-600 text-white px-1.5 py-0.5 rounded font-mono">PWA</span>
            </h1>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest">Gaming Community</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/30 px-2.5 py-1 rounded-full text-xs text-green-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            ONLINE
          </div>

          {isAdmin ? (
            <button 
              onClick={() => setIsAdmin(false)}
              className="text-xs bg-red-600/20 text-red-400 border border-red-500/30 px-2.5 py-1 rounded-lg font-medium"
            >
              Sair Admin
            </button>
          ) : (
            <button 
              onClick={() => setShowAdminModal(true)}
              className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-2.5 py-1 rounded-lg border border-gray-700"
            >
              Admin
            </button>
          )}
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-6">
        {isAdmin && (
          <button