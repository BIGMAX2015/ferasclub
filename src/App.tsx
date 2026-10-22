import React, { useState, useEffect } from 'react';
import { 
  Shield, Users, Plus, Share2, Check, Trash2, 
  Clock, MapPin, Edit3
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

  // Estados para Criar/Editar Operação
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('Persona Breakpoint');
  const [newGame, setNewGame] = useState('Ghost Recon Breakpoint');
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

  const openCreateModal = () => {
    setEditingMatchId(null);
    setNewTitle('Persona Breakpoint');
    setNewGame('Ghost Recon Breakpoint');
    setNewMap(MAP_OPTIONS[0]);
    setNewTime('21HS');
    setShowCreateModal(true);
  };

  const openEditModal = (match: Match) => {
    setEditingMatchId(match.id);
    setNewTitle(match.title);
    setNewGame(match.game);
    setNewMap(match.mapName);
    setNewTime(match.time);
    setShowCreateModal(true);
  };

  const handleSaveMatch = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingMatchId) {
      // Editar operação existente
      setMatches(prev => prev.map(m => {
        if (m.id === editingMatchId) {
          return {
            ...m,
            title: newTitle,
            game: newGame,
            mapName: newMap,
            time: newTime
          };
        }
        return m;
      }));
    } else {
      // Criar nova operação
      const newMatch: Match = {
        id: Date.now().toString(),
        title: newTitle,
        game: newGame,
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
    }

    setShowCreateModal(false);
    setEditingMatchId(null);
  };

  const deleteMatch = (matchId: string) => {
    if (confirm('Tens a certeza que queres apagar esta operação?')) {
      setMatches(prev => prev.filter(m => m.id !== matchId));
    }
  };

  const copyWhatsAppList = (match: Match) => {
    const filledPlayers = match.players.map(p => `${p.id} ${p.name ? p.name + '✅' : ''}`).join('\n');
    const obsText = match.observer.name ? `\nObservador\n9 ${match.observer.name}✅ ${match.observer.timeInfo || ''}` : '';
    
    const text = `🔥 ${match.title} 🔥\na PARTIR ✨ ${match.time} ✨\n🗺️ Jogo: ${match.game}\n🗺️ Mapa: ${match.mapName}\n\n${filledPlayers}${obsText}\n\n✨💥🔥 É FERA! 🔥💥✨`;

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
            onClick={openCreateModal}
            className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2 border border-orange-400/30 transition-all active:scale-98"
          >
            <Plus className="w-5 h-5" />
            Criar Nova Operação
          </button>
        )}

        {activeMatches.length === 0 ? (
          <div className="text-center py-16 bg-[#16161c] rounded-2xl border border-gray-800 p-6">
            <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <h3 className="text-white font-bold text-lg">Sem partidas abertas</h3>
            <p className="text-gray-400 text-sm mt-1">O organizador ainda não criou nenhuma operação para hoje.</p>
          </div>
        ) : (
          activeMatches.map(match => {
            const count = confirmedCount(match);
            const isFull = count >= 8;

            return (
              <div key={match.id} className="bg-[#16161c] rounded-2xl border border-gray-800 shadow-xl overflow-hidden">
                <div className="p-4 bg-gradient-to-r from-[#1c1c24] to-[#16161c] border-b border-gray-800 flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 text-orange-500 text-xs font-bold uppercase tracking-wider mb-1">
                      <span>🔥 {match.game}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-gray-300">
                        <MapPin className="w-3 h-3 text-orange-400" /> {match.mapName}
                      </span>
                    </div>
                    <h2 className="text-xl font-black text-white">{match.title}</h2>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                      <Clock className="w-3.5 h-3.5 text-orange-500" />
                      Hoje, a partir das <span className="text-white font-bold">{match.time}</span>
                    </p>
                  </div>

                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => openEditModal(match)}
                        className="text-gray-400 hover:text-orange-400 p-1.5 rounded-lg bg-gray-900/50"
                        title="Editar Operação"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => deleteMatch(match.id)}
                        className="text-gray-500 hover:text-red-400 p-1.5 rounded-lg bg-gray-900/50"
                        title="Apagar Operação"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 p-4 bg-[#121216]/50 border-b border-gray-800/60">
                  <div className="bg-[#1a1a22] p-2.5 rounded-xl border border-gray-800">
                    <span className="text-[10px] uppercase tracking-wider text-gray-400 block font-semibold">Jogadores</span>
                    <span className="text-lg font-black text-white">{count}/8</span>
                  </div>
                  <div className="bg-[#1a1a22] p-2.5 rounded-xl border border-gray-800">
                    <span className="text-[10px] uppercase tracking-wider text-gray-400 block font-semibold">Vagas</span>
                    <span className={`text-lg font-black ${isFull ? 'text-red-500' : 'text-orange-500'}`}>
                      {Math.max(0, 8 - count)}
                    </span>
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Lista de operadores</span>
                    <span className="text-[10px] bg-gray-800 text-gray-300 px-2 py-0.5 rounded font-mono">4 × 4</span>
                  </div>

                  <div className="space-y-1.5">
                    {match.players.map(player => (
                      <div 
                        key={player.id}
                        onClick={() => handleJoinSlot(match.id, player.id, false)}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                          player.confirmed 
                            ? 'bg-[#1c2420] border-green-500/30 hover:border-green-500/60 text-white' 
                            : 'bg-[#1a1a22] border-gray-800 hover:border-orange-500/40 text-gray-400'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                            player.confirmed ? 'bg-green-600/30 text-green-400' : 'bg-gray-800 text-gray-400'
                          }`}>
                            {player.id}
                          </span>
                          <span className={`font-medium text-sm ${player.confirmed ? 'text-white font-semibold' : 'italic text-gray-500'}`}>
                            {player.name || 'Digitar seu nick'}
                          </span>
                        </div>

                        {player.confirmed && <Check className="w-4 h-4 text-green-400" />}
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-800">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Observador</span>
                    <div 
                      onClick={() => handleJoinSlot(match.id, match.observer.id, true)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                        match.observer.confirmed 
                          ? 'bg-[#1c2420] border-green-500/30 hover:border-green-500/60 text-white' 
                          : 'bg-[#1a1a22] border-gray-800 hover:border-orange-500/40 text-gray-400'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs bg-gray-800 text-gray-400">
                          {match.observer.id}
                        </span>
                        <span className={`font-medium text-sm ${match.observer.confirmed ? 'text-white font-semibold' : 'italic text-gray-500'}`}>
                          {match.observer.name ? `${match.observer.name} ${match.observer.timeInfo || ''}` : 'Adicionar Observador'}
                        </span>
                      </div>
                      {match.observer.confirmed && <Check className="w-4 h-4 text-green-400" />}
                    </div>
                  </div>
                </div>

                <div className="p-4 pt-0">
                  <button
                    onClick={() => copyWhatsAppList(match)}
                    className="w-full bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] border border-[#25D366]/40 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-98"
                  >
                    {copiedMatchId === match.id ? (
                      <>
                        <Check className="w-5 h-5 text-green-400" />
                        <span>Lista copiada com sucesso!</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-5 h-5" />
                        <span>Copiar Lista para WhatsApp</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </main>

      {editingSlot && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#16161c] border border-gray-800 rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">
              {editingSlot.isObserver ? 'Entrar como Observador' : `Vaga #${editingSlot.slotId}`}
            </h3>
            <p className="text-xs text-gray-400">Digite o seu nick exato para garantir o seu lugar na partida.</p>
            
            <input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              placeholder="Ex: FERA Nuke"
              autoFocus
              className="w-full bg-[#0d0d0f] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 font-medium"
            />

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setEditingSlot(null)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-2.5 rounded-xl text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={savePlayerName}
                className="flex-1 bg-orange-600 hover:bg-orange-500 text-white font-bold py-2.5 rounded-xl text-sm shadow-lg shadow-orange-600/20"
              >
                Confirmar Nick
              </button>
            </div>
          </div>
        </div>
      )}

      {showAdminModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleAdminLogin} className="bg-[#16161c] border border-gray-800 rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-orange-500" />
              Área Administrativa
            </h3>
            <p className="text-xs text-gray-400">Insira a senha de organizador do FERACLUB.</p>
            
            <input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="Senha de acesso"
              autoFocus
              className="w-full bg-[#0d0d0f] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500"
            />

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAdminModal(false)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-2.5 rounded-xl text-sm"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 bg-orange-600 hover:bg-orange-500 text-white font-bold py-2.5 rounded-xl text-sm shadow-lg"
              >
                Entrar
              </button>
            </div>
          </form>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSaveMatch} className="bg-[#16161c] border border-gray-800 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-orange-500" />
              {editingMatchId ? 'Editar Operação' : 'Criar Nova Operação'}
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-400 block mb-1">Nome / Título da Partida</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  className="w-full bg-[#0d0d0f] border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 block mb-1">Nome do Jogo</label>
                <input
                  type="text"
                  value={newGame}
                  onChange={(e) => setNewGame(e.target.value)}
                  required
                  className="w-full bg-[#0d0d0f] border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 block mb-1">Mapa</label>
                <select
                  value={newMap}
                  onChange={(e) => setNewMap(e.target.value)}
                  className="w-full bg-[#0d0d0f] border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500"
                >
                  {MAP_OPTIONS.map(map => (
                    <option key={map} value={map}>{map}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 block mb-1">Horário</label>
                <input
                  type="text"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  placeholder="Ex: 21HS"
                  required
                  className="w-full bg-[#0d0d0f] border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-3">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-2.5 rounded-xl text-sm"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 bg-orange-600 hover:bg-orange-500 text-white font-bold py-2.5 rounded-xl text-sm shadow-lg shadow-orange-600/20"
              >
                {editingMatchId ? 'Salvar Alterações' : 'Criar Operação'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}