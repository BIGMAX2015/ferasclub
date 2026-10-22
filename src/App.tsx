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
    const saved = localStorage.getItem('ferasclub_matches_v2');
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
    localStorage.setItem('ferasclub_matches_v2', JSON.stringify(matches));
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
    const filledPlayers = match.players.map(p => `${p.id}${p.name ? p.name + '✅' : ''}`).join('\n');
    const obsText = match.observer.name ? `\nObservador\n9 ${match.observer.name}✅${match.observer.timeInfo || ''}` : '';
    
    const text = `🔥