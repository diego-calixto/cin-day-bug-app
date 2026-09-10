import React, { useState, useEffect, useRef } from 'react';
import { 
  ShoppingBag, 
  Trash2, 
  Bug as BugIcon, 
  Timer, 
  Play, 
  CheckCircle, 
  AlertTriangle, 
  X, 
  Plus, 
  Minus, 
  Smartphone, 
  Trophy, 
  Award,
  Sparkles,
  Wifi,
  RefreshCw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  API_BASE_URL, 
  WS_BASE_URL, 
  BUGS, 
  PRODUCTS,
  BUG_METADATA
} from './constants';
import type { Product } from './constants';

export default function App() {
  // Screen Router: 'register' | 'game' | 'game_over'
  const [screen, setScreen] = useState<'register' | 'game' | 'game_over'>('register');
  const [showLeaderboard, setShowLeaderboard] = useState<boolean>(false);

  // Connection & Offline states
  const [offlineMode, setOfflineMode] = useState<boolean>(false);
  const [wsConnected, setWsConnected] = useState<boolean>(false);

  // Player / Session states
  const [playerName, setPlayerName] = useState<string>('');
  const [playerId, setPlayerId] = useState<string>('');
  const [score, setScore] = useState<number>(0);
  const [bugsFound, setBugsFound] = useState<string[]>([]);
  const [sessionEnded, setSessionEnded] = useState<boolean>(false);

  // Game timer
  const [timeLeft, setTimeLeft] = useState<number>(120); // 2 minutes

  // Store layout states
  const [activeCategory, setActiveCategory] = useState<'all' | 'premium' | 'intermediate' | 'accessories'>('all');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);

  // Bug reporting modal states
  const [reportingBugId, setReportingBugId] = useState<string | null>(null);
  const [modalTitle, setModalTitle] = useState<string>('');
  const [modalDescription, setModalDescription] = useState<string>('');
  const [modalError, setModalError] = useState<string>('');
  const [isSubmittingReport, setIsSubmittingReport] = useState<boolean>(false);
  const [lastReportTime, setLastReportTime] = useState<number | null>(null);
  const [currentStreak, setCurrentStreak] = useState<number>(0);

  // Desktop Leaderboard screen states
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [pollingActive, setPollingActive] = useState<boolean>(false);

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // References
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // 1. Detect Screen and Restore Session on Mount
  useEffect(() => {
    // Determine screen route via URL hash or path
    const path = window.location.hash || window.location.pathname;
    if (path.includes('leaderboard')) {
      setShowLeaderboard(true);
    }

    // Hash/Path change listener
    const handleLocationChange = () => {
      const currentPath = window.location.hash || window.location.pathname;
      if (currentPath.includes('leaderboard')) {
        setShowLeaderboard(true);
      } else {
        setShowLeaderboard(false);
      }
    };
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);

    // Restore player session if they refreshed
    const cachedId = sessionStorage.getItem('moto_player_id');
    const cachedName = sessionStorage.getItem('moto_player_name');
    const cachedBugs = sessionStorage.getItem('moto_bugs_found');
    const cachedEnded = sessionStorage.getItem('moto_session_ended');

    if (cachedId && cachedName) {
      setPlayerId(cachedId);
      setPlayerName(cachedName);
      
      const parsedBugs = cachedBugs ? JSON.parse(cachedBugs) : [];
      setBugsFound(parsedBugs);
      setScore(parsedBugs.length);

      if (cachedEnded === 'true') {
        setSessionEnded(true);
        setScreen('game_over');
      } else {
        // Calculate remaining time from storage if we have a started timestamp
        const startTime = sessionStorage.getItem('moto_session_start_time');
        if (startTime) {
          const elapsed = Math.floor((Date.now() - parseInt(startTime, 10)) / 1000);
          const remaining = 120 - elapsed;
          if (remaining > 0) {
            setTimeLeft(remaining);
            setScreen('game');
          } else {
            handleGameOver(cachedId, parsedBugs.length);
          }
        } else {
          setScreen('game');
        }
      }
    }

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // 2. Timer Countdown Hook
  useEffect(() => {
    if (screen === 'game' && !sessionEnded && !showLeaderboard) {
      if (!sessionStorage.getItem('moto_session_start_time')) {
        sessionStorage.setItem('moto_session_start_time', Date.now().toString());
      }

      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            handleGameOver(playerId, score);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [screen, sessionEnded, playerId, score, showLeaderboard]);

  // 3. Desktop Leaderboard Real-time WebSocket / Polling Setup
  useEffect(() => {
    if (showLeaderboard) {
      connectWebSocket();
    } else {
      if (wsRef.current) {
        wsRef.current.close();
      }
    }

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [showLeaderboard]);

  const connectWebSocket = () => {
    try {
      wsRef.current = new WebSocket(WS_BASE_URL);
      
      wsRef.current.onopen = () => {
        setWsConnected(true);
        setPollingActive(false);
        showToast("Conectado ao ranking do placar ao vivo", "success");
      };

      wsRef.current.onmessage = (event) => {
        const payload = JSON.parse(event.data);
        if (payload.type === 'leaderboard') {
          setLeaderboard(payload.data);
        }
      };

      wsRef.current.onerror = () => {
        setWsConnected(false);
        startLeaderboardPolling();
      };

      wsRef.current.onclose = () => {
        setWsConnected(false);
        startLeaderboardPolling();
      };
    } catch (e) {
      setWsConnected(false);
      startLeaderboardPolling();
    }
  };

  const startLeaderboardPolling = () => {
    if (pollingActive) return;
    setPollingActive(true);
    showToast("Servidor offline. Alternado para polling REST ao vivo.", "info");
    
    // Initial fetch
    fetchLeaderboardRest();
    
    // Interval polling
    const pollInterval = setInterval(() => {
      if (!wsConnected && showLeaderboard) {
        fetchLeaderboardRest();
      } else {
        clearInterval(pollInterval);
        setPollingActive(false);
      }
    }, 5000);
  };

  const fetchLeaderboardRest = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/players/top10`);
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data);
      } else {
        throw new Error("Polling fail");
      }
    } catch (err) {
      // Offline fallback mock data
      const mockLeaderboard = [
        { name: "Motorola Pro", score: 5, session_ended: true },
        { name: "Goji AI", score: 4, session_ended: true },
        { name: "Dev Master", score: 3, session_ended: true },
        { name: "Beta Tester", score: 2, session_ended: true },
        { name: "SpeedRunner", score: 1, session_ended: true }
      ];
      setLeaderboard(mockLeaderboard);
    }
  };

  // Helper: Format timer
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Helper: Show Toasts
  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // 4. Action: Start Player Session Onboarding (FR01)
  const handleStartOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedName = playerName.trim();
    if (!cleanedName) {
      showToast("O nome é obrigatório para começar!", "error");
      return;
    }
    if (cleanedName.length > 30) {
      showToast("O nome deve ter menos de 30 caracteres!", "error");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/players`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: cleanedName })
      });

      if (response.ok) {
        const player = await response.json();
        initializeSession(player.id, player.name);
      } else {
        throw new Error("Server error");
      }
    } catch (err) {
      // Offline fallback creation
      const localId = 'offline_' + Math.random().toString(36).substr(2, 9);
      initializeSession(localId, cleanedName, true);
    }
  };

  const initializeSession = (id: string, name: string, isOffline = false) => {
    sessionStorage.clear(); // Clear old runs
    sessionStorage.setItem('moto_player_id', id);
    sessionStorage.setItem('moto_player_name', name);
    sessionStorage.setItem('moto_session_start_time', Date.now().toString());
    
    setPlayerId(id);
    setPlayerName(name);
    setBugsFound([]);
    setScore(0);
    setCart({});
    setTimeLeft(120);
    setSessionEnded(false);
    setOfflineMode(isOffline);

    if (isOffline) {
      showToast("Conexão offline. Executando no Modo Local Offline!", "info");
    } else {
      showToast(`Bem-vindo(a), ${name}! Vá encontrar esses bugs!`, "success");
    }

    setScreen('game');
  };

  // 5. Action: Bug Capture Wrapper Tapped (FR04)
  const handleBugTap = (bugId: string) => {
    if (bugsFound.includes(bugId)) {
      showToast("Você já relatou este bug!", "error");
      return;
    }
    
    const bugInfo = BUGS[bugId];
    if (bugInfo) {
      setReportingBugId(bugId);
      setModalTitle('');
      setModalDescription('');
      setModalError('');
    }
  };

  // Local score calculation for offline or fallback paths (severity, semantic keywords, time, streak)
  const calculateLocalScore = (
    bugId: string,
    description: string,
    secondsRemaining: number,
    streakCount: number
  ): number => {
    const meta = BUG_METADATA[bugId];
    if (!meta) return 0;
    let localScore = meta.basePoints;

    let matched = 0;
    const descLower = description.toLowerCase();
    for (const kw of meta.keywords) {
      if (descLower.includes(kw)) {
        matched++;
      }
    }

    if (matched >= 2) {
      localScore += 100;
    } else if (matched === 1) {
      localScore += 50;
    }

    localScore += secondsRemaining * 2;

    const streakBonuses = [0, 0, 50, 100, 200, 400];
    const streakIdx = Math.min(streakCount, 5);
    localScore += streakBonuses[streakIdx];

    return localScore;
  };

  // 6. Action: Submit Bug Report (FR05 + FR06 + NFR03)
  const handleBugSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (modalTitle.trim().length < 5) {
      setModalError("O título deve ter pelo menos 5 caracteres.");
      return;
    }
    if (modalDescription.trim().length < 15) {
      setModalError("A descrição deve ter pelo menos 15 caracteres.");
      return;
    }

    setIsSubmittingReport(true);

    const now = Date.now();
    let newStreak = 1;
    if (lastReportTime !== null) {
      const timeDiffSeconds = (now - lastReportTime) / 1000;
      if (timeDiffSeconds <= 30) {
        newStreak = currentStreak + 1;
      } else {
        newStreak = 1;
      }
    }

    if (offlineMode) {
      // Local/Offline state submission
      const updatedBugs = [...bugsFound, reportingBugId!];
      setBugsFound(updatedBugs);
      const addedPoints = calculateLocalScore(reportingBugId!, modalDescription.trim(), timeLeft, newStreak);
      const newTotalScore = score + addedPoints;
      setScore(newTotalScore);
      sessionStorage.setItem('moto_bugs_found', JSON.stringify(updatedBugs));
      
      showToast(`Bug relatado localmente! +${addedPoints} Pontos`, "success");
      setLastReportTime(now);
      setCurrentStreak(newStreak);
      setReportingBugId(null);
      setIsSubmittingReport(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/bug_reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_id: playerId,
          bug_id: reportingBugId,
          title: modalTitle.trim(),
          description: modalDescription.trim(),
          seconds_remaining: timeLeft,
          streak_count: newStreak
        })
      });

      if (response.ok) {
        const data = await response.json();
        const updatedBugs = [...bugsFound, reportingBugId!];
        setBugsFound(updatedBugs);
        setScore(data.score || updatedBugs.length);
        sessionStorage.setItem('moto_bugs_found', JSON.stringify(updatedBugs));
        
        showToast(`Bug verificado com sucesso! +${data.points_added || 1} Pontos`, "success");
        setLastReportTime(now);
        setCurrentStreak(newStreak);
        setReportingBugId(null);
      } else {
        const errorData = await response.json();
        showToast(errorData.detail || "Falha ao enviar relatório.", "error");
      }
    } catch (err) {
      showToast("Falha no envio. Alternado para salvamento offline.", "error");
      // Fallback save in memory
      const updatedBugs = [...bugsFound, reportingBugId!];
      setBugsFound(updatedBugs);
      const addedPoints = calculateLocalScore(reportingBugId!, modalDescription.trim(), timeLeft, newStreak);
      const newTotalScore = score + addedPoints;
      setScore(newTotalScore);
      sessionStorage.setItem('moto_bugs_found', JSON.stringify(updatedBugs));
      setLastReportTime(now);
      setCurrentStreak(newStreak);
      setReportingBugId(null);
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // 7. Action: Timer End / Session Completion (FR02)
  const handleGameOver = async (id: string, finalScore: number) => {
    setSessionEnded(true);
    sessionStorage.setItem('moto_session_ended', 'true');
    setScreen('game_over');

    // Trigger confetti on high success!
    if (finalScore >= 3) {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });
    }

    if (!offlineMode) {
      try {
        await fetch(`${API_BASE_URL}/api/players/${id}/end`, { method: 'POST' });
      } catch (err) {
        logger("Falha ao sincronizar término da sessão com a API");
      }
    }
  };

  const logger = (msg: string) => {
    console.warn(msg);
  };

  // Reset/Restart Game Session
  const handleResetChallenge = () => {
    sessionStorage.clear();
    setScreen('register');
    setPlayerName('');
    setPlayerId('');
    setScore(0);
    setBugsFound([]);
    setCart({});
    setTimeLeft(120);
    setSessionEnded(false);
    setLastReportTime(null);
    setCurrentStreak(0);
    setReportingBugId(null);
  };

  // 8. E-commerce simulated state operations
  const addToCart = (product: Product) => {
    if (product.id === 'moto_g_power' && cart[product.id] !== undefined) {
      setCart((prev) => ({ ...prev, [product.id]: 0 }));
      showToast("Quantidade reiniciada para 0 devido a uma exceção crítica no script do carrinho!", "error");
      return;
    }
    setCart((prev) => {
      const q = prev[product.id] || 0;
      return { ...prev, [product.id]: q + 1 };
    });
    showToast(`${product.name} adicionado ao carrinho!`, "success");
  };

  // BUG C - QUANTITY RESET LOOP: If increase is clicked, reset to 0
  const handleCartQtyIncrease = (productId: string) => {
    if (productId === 'moto_g_power') {
      // Trigger Bug C (Loop/Reset quantity)
      setCart((prev) => ({ ...prev, [productId]: 0 }));
      showToast("Quantidade reiniciada para 0 devido a uma exceção crítica no script do carrinho!", "error");
    } else {
      setCart((prev) => ({ ...prev, [productId]: (prev[productId] || 0) + 1 }));
    }
  };

  const handleCartQtyDecrease = (productId: string) => {
    setCart((prev) => {
      const q = prev[productId] || 0;
      if (q <= 1) {
        const next = { ...prev };
        delete next[productId];
        return next;
      }
      return { ...prev, [productId]: q - 1 };
    });
  };

  const removeCartItem = (productId: string) => {
    setCart((prev) => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
  };

  // Calculate cart total including potential Bug A (negative price)
  const cartTotal = Object.entries(cart).reduce((sum, [id, qty]) => {
    const prod = PRODUCTS.find(p => p.id === id);
    if (!prod) return sum;
    return sum + (prod.price * qty);
  }, 0);

  const cartItemCount = Object.values(cart).reduce((sum, q) => sum + q, 0);

  // Filter Catalog Products
  const filteredProducts = PRODUCTS.filter(prod => {
    if (activeCategory === 'all') return true;
    
    // BUG E: accessories filter clears everything completely showing blank screen
    if (activeCategory === 'accessories' && prod.category === 'accessories') {
      return false; // seed empty behavior
    }
    
    return prod.category === activeCategory;
  });

  // Render Layouts: 

  // --- RENDERING 1: TV/DESKTOP LEADERBOARD DISPLAY ---
  if (showLeaderboard) {
    return (
      <div className="min-h-screen bg-[#06050b] text-white flex flex-col justify-between p-8 relative overflow-hidden font-sans select-none">
        {/* Neon Background Gradients */}
        <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-violet-950/20 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-cyan-950/20 blur-[120px] pointer-events-none" />

        {/* Top Header Section */}
        <div className="flex justify-between items-center z-10 border-b border-white/5 pb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-2xl shadow-lg shadow-indigo-500/20">
              <Trophy className="w-8 h-8 text-cyan-200 animate-pulse" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-neutral-100 to-slate-400 bg-clip-text text-transparent">
                DESAFIO MOTOROLA
              </h1>
              <p className="text-sm text-cyan-400 font-semibold tracking-wider uppercase">
                Placar ao Vivo do CIn Open Day
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 bg-slate-900/40 px-5 py-2.5 rounded-2xl border border-white/5 backdrop-blur-md shadow-inner">
            <div className="flex items-center gap-2">
              {wsConnected ? (
                <>
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                  <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                    <Wifi className="w-4 h-4" /> Sincronização ao Vivo
                  </span>
                </>
              ) : (
                <>
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                  </span>
                  <span className="text-xs font-semibold text-amber-400 uppercase tracking-widest flex items-center gap-1">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Polling REST
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Live Leaderboard Main Table */}
        <div className="flex-1 my-8 flex flex-col justify-center items-center z-10">
          <div className="w-full max-w-5xl bg-slate-900/30 rounded-3xl border border-white/5 backdrop-blur-xl shadow-2xl p-6 relative">
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
            
            <div className="grid grid-cols-12 text-sm font-semibold tracking-wider text-slate-400 uppercase border-b border-white/5 pb-4 px-6 mb-2">
              <div className="col-span-2 text-center">Posição</div>
              <div className="col-span-6">Nome</div>
              <div className="col-span-2 text-center">Conclusão</div>
              <div className="col-span-2 text-right">Pontuação</div>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {leaderboard.length === 0 ? (
                <div className="text-center py-20 text-slate-500 font-medium">
                  Aguardando os jogadores enviarem bugs... Escaneie o código QR no celular para começar!
                </div>
              ) : (
                leaderboard.map((player, idx) => {
                  const isTop3 = idx < 3;
                  const rankStyles = [
                    "bg-gradient-to-r from-amber-400/20 to-yellow-600/10 border-yellow-500/30 text-yellow-300 shadow-yellow-500/5",
                    "bg-gradient-to-r from-slate-300/20 to-slate-400/10 border-slate-400/30 text-slate-200 shadow-slate-400/5",
                    "bg-gradient-to-r from-amber-600/20 to-orange-800/10 border-orange-700/30 text-orange-300 shadow-orange-700/5"
                  ];
                  return (
                    <div 
                      key={player.id || idx}
                      className={`grid grid-cols-12 items-center px-6 py-4.5 rounded-2xl border transition-all duration-300 hover:scale-[1.01] ${
                        isTop3 
                        ? `${rankStyles[idx]} border-opacity-40 font-bold shadow-lg` 
                        : "bg-white/5 border-white/5 text-slate-300 hover:bg-white/10"
                      }`}
                    >
                      <div className="col-span-2 flex justify-center items-center">
                        {idx === 0 && <Trophy className="w-6 h-6 text-amber-400 mr-1" />}
                        {idx === 1 && <Award className="w-6 h-6 text-slate-300 mr-1" />}
                        {idx === 2 && <Award className="w-6 h-6 text-orange-400 mr-1" />}
                        {idx > 2 && <span className="font-mono text-lg text-slate-500">#{idx + 1}</span>}
                      </div>
                      
                      <div className="col-span-6 flex items-center gap-3">
                        <span className="text-lg tracking-wide uppercase font-semibold">
                          {player.name}
                        </span>
                        {player.session_ended && (
                          <span className="text-[10px] uppercase font-bold tracking-widest bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 px-2 py-0.5 rounded-full">
                            Concluído
                          </span>
                        )}
                      </div>

                      <div className="col-span-2 text-center text-sm font-mono text-slate-400">
                        {player.created_at ? new Date(player.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Ao Vivo"}
                      </div>

                      <div className="col-span-2 text-right flex justify-end items-center gap-2 pr-4">
                        <span className={`text-2xl font-mono ${isTop3 ? 'font-black' : 'font-bold'}`}>
                          {player.score}
                        </span>
                        <span className="text-xs text-slate-500">pts</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer Area with QR-Code Mock */}
        <div className="flex justify-between items-center border-t border-white/5 pt-6 z-10">
          <p className="text-sm text-slate-500 font-medium">
            © 2026 Desafio Mobile Motorola. Projetado exclusivamente para o Developer Booth Sync.
          </p>
          <div className="flex items-center gap-4 bg-slate-900/60 px-5 py-3 rounded-2xl border border-white/10 shadow-lg">
            <div className="text-right">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Entrar no Jogo</p>
              <p className="text-sm font-extrabold text-cyan-400">Escaneie o código QR no Balcão!</p>
            </div>
            <div className="w-10 h-10 bg-white rounded-lg p-1 flex items-center justify-center">
              {/* Simple Mock QR Icon */}
              <div className="w-full h-full bg-neutral-900 rounded-sm flex flex-col justify-between p-1">
                <div className="flex justify-between">
                  <div className="w-2 h-2 bg-white" />
                  <div className="w-2 h-2 bg-white" />
                </div>
                <div className="flex justify-between">
                  <div className="w-2 h-2 bg-white" />
                  <div className="w-2.5 h-2.5 bg-cyan-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDERING 2: MOBILE PLAYER ONBOARDING / CHALLENGE WORKSPACE ---
  return (
    <div className="min-h-screen bg-[#0d0c15] text-white flex justify-center p-0 font-sans relative overflow-x-hidden antialiased select-none">
      {/* Container simulating a standalone mobile layout container */}
      <div className="w-full max-w-md bg-[#0a0910] min-h-screen flex flex-col justify-between border-x border-neutral-900 shadow-2xl relative">
        
        {/* Floating toast alerts */}
        {toast && (
          <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-lg max-w-[90vw] animate-bounce ${
            toast.type === 'success' ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-200' :
            toast.type === 'error' ? 'bg-rose-950/90 border-rose-500/30 text-rose-200' :
            'bg-slate-950/90 border-slate-500/30 text-slate-200'
          }`}>
            {toast.type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" /> :
             toast.type === 'error' ? <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" /> :
             <BugIcon className="w-5 h-5 text-cyan-400 shrink-0" />}
            <span className="text-xs font-semibold tracking-wide">{toast.message}</span>
          </div>
        )}

        {/* SCREEN 1: ONBOARDING / REGISTRATION */}
        {screen === 'register' && (
          <div className="flex-1 flex flex-col justify-between p-6">
            <div className="my-auto space-y-8 py-10">
              {/* Glowing Top Emblem */}
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-20 h-20 bg-gradient-to-tr from-violet-600 to-cyan-500 rounded-3xl flex items-center justify-center shadow-lg shadow-violet-500/30 relative">
                  <BugIcon className="w-10 h-10 text-white animate-pulse" />
                  <div className="absolute inset-0 rounded-3xl border border-white/20 animate-ping opacity-40 scale-105" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-3xl font-black bg-gradient-to-r from-violet-400 via-white to-cyan-300 bg-clip-text text-transparent tracking-tight">
                    CAÇADOR DE BUGS
                  </h2>
                  <p className="text-xs uppercase font-extrabold tracking-widest text-cyan-400">
                    Desafio Motorola CIn Open Day
                  </p>
                </div>
              </div>

              {/* Instructions Panel */}
              <div className="bg-slate-900/60 rounded-2xl border border-white/5 p-4.5 space-y-3.5 shadow-xl">
                <h3 className="text-sm font-extrabold text-violet-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-violet-400" /> Regras do Desafio:
                </h3>
                <ul className="text-xs text-slate-300 space-y-2.5">
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-cyan-400 font-bold">1.</span>
                    <span>Você tem <strong>2 minutos (02:00)</strong> para explorar um catálogo simulado de e-commerce da Motorola.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-cyan-400 font-bold">2.</span>
                    <span>Encontre bugs intencionais (ex: erros no preço, layouts quebrados, congelamentos de loop de navegação).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-cyan-400 font-bold">3.</span>
                    <span>Toque diretamente nos elementos quebrados, relate-os e garanta seu lugar no grande painel da TV!</span>
                  </li>
                </ul>
              </div>

              {/* Onboarding Form */}
              <form onSubmit={handleStartOnboarding} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">
                    Insira seu Nome:
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={30}
                    placeholder="ex: Diego (Especialista em QA)"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-semibold tracking-wide text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all shadow-inner"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 border border-violet-400/20 rounded-xl py-3.5 text-sm font-extrabold uppercase tracking-widest shadow-lg shadow-indigo-600/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current text-white" /> Começar Desafio
                </button>
              </form>
            </div>

            {/* Bottom Brand */}
            <div className="text-center pt-4">
              <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase flex items-center justify-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-slate-500" /> OTIMIZADO PARA CELULAR
              </p>
            </div>
          </div>
        )}

        {/* SCREEN 2: GAME STORE WORKSPACE */}
        {screen === 'game' && (
          <div className="flex-1 flex flex-col">
            
            {/* Fixed Header */}
            <header className="sticky top-0 bg-[#0d0c15]/95 border-b border-white/5 px-4 py-3.5 backdrop-blur-md z-30 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-gradient-to-tr from-violet-600 to-cyan-500 rounded-lg">
                  <BugIcon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="text-xs font-black tracking-tight leading-none text-white">SIMULAÇÃO MOTO</h1>
                  <span className="text-[9px] font-bold text-cyan-400 leading-none tracking-widest uppercase">CIN OPEN DAY</span>
                </div>
              </div>

              {/* Status indicators */}
              <div className="flex items-center gap-3">
                {/* Timer Display */}
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-mono text-sm font-bold ${
                  timeLeft <= 30 
                  ? 'bg-rose-550/15 border-rose-500/30 text-rose-400 animate-pulse' 
                  : 'bg-slate-900/60 border-white/5 text-slate-200'
                }`}>
                  <Timer className="w-4 h-4 shrink-0" />
                  <span>{formatTime(timeLeft)}</span>
                </div>

                {/* Bug Counter */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600/10 border border-violet-500/25 text-violet-300 font-mono text-sm font-bold">
                  <BugIcon className="w-4 h-4 shrink-0" />
                  <span>{bugsFound.length}/6</span>
                </div>
                </div>
                </header>

                {/* Simulated Banner */}
                <div className="p-4">
                <div className="bg-gradient-to-r from-violet-900/50 via-indigo-900/30 to-cyan-950/40 rounded-2xl p-4 border border-white/5 relative overflow-hidden">
                <div className="absolute right-[-10%] top-[-30%] w-32 h-32 bg-violet-500/10 rounded-full blur-2xl" />
                <h3 className="text-sm font-black tracking-tight text-white mb-1 uppercase">VENDA EXCLUSIVA DO STAND</h3>
                <p className="text-[11px] text-slate-300 leading-relaxed max-w-[80%] mb-2">
                  Encontre discrepâncias de código ocultas neste processo de checkout em tempo real. Teste com atenção!
                </p>
                <div className="inline-block text-[9px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/60 border border-cyan-800/30 px-2.5 py-0.5 rounded-full">
                  6 Bugs Intencionais Ocultos
                </div>
              </div>
            </div>

            {/* Store Navigation Categories */}
            <div className="px-4 pb-2 flex gap-1.5 overflow-x-auto scrollbar-none">
              {(['all', 'premium', 'intermediate', 'accessories'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap border cursor-pointer transition-all ${
                    activeCategory === cat
                    ? "bg-white text-black border-white"
                    : "bg-slate-900/50 border-white/5 text-slate-400 hover:text-white"
                  }`}
                >
                  {cat === 'all' ? 'Todos' : cat === 'premium' ? 'Premium' : cat === 'intermediate' ? 'Intermediários' : 'Acessórios'}
                </button>
              ))}
            </div>

            {/* Product Catalog Grid (FR03) */}
            <div className="flex-1 px-4 py-2">
              {filteredProducts.length === 0 ? (
                // BUG E: accessory selection triggers blank screen (stealth mode)
                <div 
                  onClick={() => handleBugTap('bug_filter')}
                  className="min-h-[300px] w-full cursor-pointer"
                >
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3.5">
                  {filteredProducts.map((prod) => {
                    // Check if this product triggers BUG A (Negative Price)
                    const isBugPrice = prod.id === 'moto_g_power';
                    // Check if this product triggers BUG D (Broken HTML Description)
                    const isBugText = prod.id === 'moto_razr';

                    return (
                      <div 
                        key={prod.id} 
                        className="bg-slate-900/40 rounded-2xl border border-white/5 p-3 flex flex-col justify-between hover:border-white/10 transition-all relative group"
                      >
                        <div className="space-y-2">
                          {/* Image with fallbacks */}
                          <div className="aspect-square bg-slate-950/80 rounded-xl overflow-hidden flex items-center justify-center p-2">
                            {prod.id === 'moto_charger' ? (
                              <img 
                                src={prod.image} 
                                alt={prod.name}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleBugTap('bug_image');
                                }}
                                className="object-contain w-full h-full group-hover:scale-105 transition-all cursor-pointer"
                              />
                            ) : (
                              <img 
                                src={prod.image} 
                                alt={prod.name}
                                className="object-contain w-full h-full group-hover:scale-105 transition-all"
                              />
                            )}
                          </div>

                          {/* Category Tag */}
                          <span className="text-[9px] uppercase font-bold tracking-widest text-violet-400">
                            {prod.category === 'premium' ? 'Premium' : prod.category === 'intermediate' ? 'Intermediário' : 'Acessórios'}
                          </span>

                          {/* Product Name */}
                          <h4 className="text-xs font-extrabold tracking-tight text-white leading-tight">
                            {prod.name}
                          </h4>

                          {/* Product Description with seed D (Corrupted Text) */}
                          <div className={`text-[10px] text-slate-400 leading-relaxed min-h-[30px] ${isBugText ? "" : "line-clamp-2"}`}>
                            {isBugText ? (
                              <div 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleBugTap('bug_text');
                                }}
                                className="cursor-pointer"
                              >
                                <div dangerouslySetInnerHTML={{ __html: prod.description }} />
                              </div>
                            ) : (
                              prod.description
                            )}
                          </div>
                        </div>

                        {/* Price Area with seed A (Negative Price) */}
                        <div className="mt-3.5 space-y-2 pt-2 border-t border-white/5">
                          <div className="flex justify-between items-end">
                            {isBugPrice ? (
                              <div 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleBugTap('bug_price');
                                }}
                                className="cursor-pointer w-full"
                              >
                                <span className="text-xs text-slate-500 line-through block font-mono">$299.99</span>
                                <span className="text-sm font-black text-cyan-300 block">-$999.00</span>
                              </div>
                            ) : (
                              <div>
                                {prod.originalPrice && (
                                  <span className="text-[10px] text-slate-500 line-through block font-mono">
                                    ${prod.originalPrice.toFixed(2)}
                                  </span>
                                )}
                                <span className="text-sm font-black text-cyan-300 font-mono">
                                  ${prod.price.toFixed(2)}
                                </span>
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => addToCart(prod)}
                            className="w-full bg-slate-900 border border-white/5 hover:bg-slate-800 py-2.5 rounded-xl text-[10px] font-extrabold uppercase tracking-widest cursor-pointer transition-all text-white active:scale-95"
                          >
                            Adicionar ao Carrinho
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Shopping Cart Drawer Trigger Button */}
            <div className="sticky bottom-0 inset-x-0 p-4 bg-[#0a0910]/95 border-t border-white/5 backdrop-blur-md z-20 flex justify-between items-center">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Itens Selecionados</p>
                <p className="text-sm font-black text-white">{cartItemCount} {cartItemCount === 1 ? 'Produto' : 'Produtos'}</p>
              </div>
              <button
                onClick={() => setIsCartOpen(true)}
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer active:scale-95 transition-all text-white"
              >
                <ShoppingBag className="w-4 h-4" /> Ver Carrinho
              </button>
            </div>

            {/* Sliding Shopping Cart Drawer (FR03) */}
            {isCartOpen && (
              <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 flex justify-end">
                {/* Backdrop Click Dismiss */}
                <div className="absolute inset-0" onClick={() => setIsCartOpen(false)} />
                
                {/* Drawer Body */}
                <div className="w-full max-w-sm bg-[#0c0b12] h-full shadow-2xl relative flex flex-col justify-between z-50 border-l border-white/5 animate-slide-in">
                  
                  {/* Drawer Header */}
                  <div className="p-4 border-b border-white/5 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="w-5 h-5 text-violet-400" />
                      <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Shopping Cart</h3>
                    </div>
                    <button 
                      onClick={() => setIsCartOpen(false)}
                      className="p-1.5 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Cart Items List */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {Object.keys(cart).length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6">
                        <ShoppingBag className="w-12 h-12 text-slate-600 mb-2" />
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Seu carrinho está vazio</p>
                        <p className="text-[10px] text-slate-500">Volte e adicione alguns produtos!</p>
                      </div>
                    ) : (
                      Object.entries(cart).map(([id, qty]) => {
                        const prod = PRODUCTS.find(p => p.id === id);
                        if (!prod) return null;
                        
                        // Check if this item triggers BUG C (Quantity Loop)
                        const isBugLoop = prod.id === 'moto_g_power';

                        return (
                          <div 
                            key={prod.id}
                            className="bg-slate-900/60 rounded-xl border border-white/5 p-3 flex gap-3 items-center justify-between"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-slate-950 rounded-lg p-1 shrink-0">
                                <img src={prod.image} alt={prod.name} className="object-contain w-full h-full" />
                              </div>
                              <div>
                                <h4 className="text-xs font-bold text-white max-w-[150px] truncate">{prod.name}</h4>
                                <span className={`text-xs font-mono font-black ${prod.price < 0 ? 'text-rose-400' : 'text-cyan-300'}`}>
                                  ${prod.price.toFixed(2)}
                                </span>
                              </div>
                            </div>

                            {/* Quantity Controls */}
                            <div className="flex items-center gap-2">
                              {/* Decrease Button */}
                              <button 
                                onClick={() => handleCartQtyDecrease(prod.id)}
                                className="p-1 bg-white/5 hover:bg-white/10 text-white rounded cursor-pointer"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              
                              {/* Quantity indicator with seeded C (Quantity Loop) */}
                              {isBugLoop ? (
                                <span 
                                  onClick={() => handleBugTap('bug_loop')}
                                  className="font-mono text-xs font-bold text-slate-200 cursor-pointer"
                                >
                                  {qty}
                                </span>
                              ) : (
                                <span className="font-mono text-xs font-bold text-slate-200">{qty}</span>
                              )}

                              {/* Increase Button */}
                              <button 
                                onClick={() => handleCartQtyIncrease(prod.id)}
                                className="p-1 bg-white/5 hover:bg-white/10 text-white rounded cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>

                              {/* Remove Item */}
                              <button 
                                onClick={() => removeCartItem(prod.id)}
                                className="p-1 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 rounded transition-all ml-1 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Drawer Footer and Checkout CTA */}
                  <div className="p-4 border-t border-white/5 bg-slate-900/30 space-y-4">
                    
                    {/* Cart Totals Display with seed B (Overlapping Checkout CTA button) */}
                    <div className="relative">
                      
                      {/* Total details */}
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Frete</span>
                        <span className="text-xs font-mono font-bold text-emerald-400">GRÁTIS</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-extrabold text-white uppercase tracking-wider">Subtotal:</span>
                        <span className={`text-lg font-mono font-black ${cartTotal < 0 ? 'text-rose-400' : 'text-cyan-300'}`}>
                          ${cartTotal.toFixed(2)}
                        </span>
                      </div>

                      {/* BUG B: Overlapping Checkout Button Target and Layer */}
                      <div 
                        onClick={() => handleBugTap('bug_layout')}
                        className="absolute inset-0 cursor-pointer z-10 opacity-0"
                      >
                      </div>
                    </div>

                    {/* Checkout Button styled with seed B (pushed upwards, overlapping text) */}
                    <button
                      onClick={() => {
                        // User triggers Checkout - let's show success if no negative value or warn if buggy
                        if (cartTotal < 0) {
                          showToast("Checkout inválido: O preço não pode ser negativo. Relate o Bug A!", "error");
                        } else {
                          showToast("Simulação Concluída! Checkout simulado padrão finalizado.", "success");
                          setIsCartOpen(false);
                        }
                      }}
                      className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-black py-3.5 rounded-xl text-xs font-extrabold uppercase tracking-widest flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition-all cursor-pointer relative"
                      style={{ marginTop: '-36px' }} // Seed B: Overlaps total above!
                    >
                      Finalizar Compra
                    </button>
                  </div>

                </div>
              </div>
            )}

            {/* BUG REPORTING MODAL (FR05) */}
            {reportingBugId !== null && (
              <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
                <div className="w-full max-w-sm bg-slate-900 rounded-3xl border border-red-500/30 shadow-2xl overflow-hidden relative animate-bounce-in">
                  
                  {/* Decorative glowing red bug outline */}
                  <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-red-600 via-rose-500 to-orange-500" />
                  
                  {/* Modal Header */}
                  <div className="p-5 border-b border-white/5 flex items-center gap-3">
                    <div className="p-2.5 bg-red-500/15 rounded-2xl text-red-400">
                      <BugIcon className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-white uppercase tracking-wider">Relatar Bug Encontrado</h4>
                      <p className="text-[10px] text-slate-500 font-bold">Verificação: {reportingBugId}</p>
                    </div>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleBugSubmit} className="p-5 space-y-4">
                    {modalError && (
                      <div className="bg-red-950/40 border border-red-500/30 text-red-200 text-xs px-3.5 py-2.5 rounded-xl font-medium">
                        {modalError}
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                        Título do Bug:
                      </label>
                      <input
                        type="text"
                        required
                        minLength={3}
                        value={modalTitle}
                        onChange={(e) => setModalTitle(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-3 text-xs font-semibold text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                        placeholder="Título breve do problema"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                        Descrição do Bug:
                      </label>
                      <textarea
                        required
                        minLength={10}
                        rows={4}
                        value={modalDescription}
                        onChange={(e) => setModalDescription(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-3 text-xs font-semibold text-white focus:outline-none focus:ring-1 focus:ring-red-500 resize-none leading-relaxed"
                        placeholder="Explique como reproduzir o bug e o que deu errado."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setReportingBugId(null)}
                        className="bg-white/5 border border-white/5 hover:bg-white/10 py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-slate-300 cursor-pointer transition-all active:scale-95"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmittingReport}
                        className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white py-3 rounded-xl text-xs font-extrabold uppercase tracking-widest shadow-lg shadow-red-500/10 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95 transition-all"
                      >
                        {isSubmittingReport ? 'Enviando...' : 'Enviar Relatório'}
                      </button>
                    </div>
                  </form>

                </div>
              </div>
            )}

          </div>
        )}

        {/* SCREEN 3: GAME OVER / SCORE SUMMARY */}
        {screen === 'game_over' && (
          <div className="flex-1 flex flex-col justify-between p-6 text-center">
            
            <div className="my-auto space-y-8 py-10">
              {/* Achievement Trophy icon */}
              <div className="flex flex-col items-center space-y-4">
                <div className="w-24 h-24 bg-gradient-to-tr from-amber-400 via-yellow-500 to-orange-600 rounded-3xl flex items-center justify-center shadow-lg shadow-orange-500/20 relative animate-pulse">
                  <Trophy className="w-12 h-12 text-white" />
                  <div className="absolute inset-0 rounded-3xl border border-white/20 animate-ping opacity-25 scale-110" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-3xl font-black bg-gradient-to-r from-amber-400 via-white to-orange-300 bg-clip-text text-transparent tracking-tight">
                    DESAFIO CONCLUÍDO!
                  </h2>
                  <p className="text-xs uppercase font-extrabold tracking-widest text-cyan-400">
                    Obrigado por jogar
                  </p>
                </div>
              </div>

              {/* Player Score Panel */}
              <div className="bg-slate-900/60 rounded-3xl border border-white/5 p-6 space-y-3.5 shadow-2xl relative">
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
                
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Perfil do Jogador</p>
                  <p className="text-xl font-extrabold text-white tracking-wide uppercase">{playerName}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 divide-x divide-white/5 pt-2">
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Bugs Identificados</p>
                    <div className="flex justify-center items-end gap-1 font-mono">
                      <span className="text-4xl font-black text-transparent bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text">
                        {bugsFound.length}
                      </span>
                      <span className="text-sm font-bold text-slate-600 mb-1">/ 6</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Pontos Totais</p>
                    <div className="flex justify-center items-end gap-1 font-mono">
                      <span className="text-4xl font-black text-transparent bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text">
                        {score}
                      </span>
                      <span className="text-sm font-bold text-slate-600 mb-1">pts</span>
                    </div>
                  </div>
                </div>

                {/* Rank Feedback */}
                <p className="text-xs font-semibold text-slate-300 leading-relaxed px-4">
                  {bugsFound.length === 6 ? "🏆 Lenda Absoluta! Trabalho excelente, você encontrou todos os erros!" :
                   bugsFound.length >= 4 ? "👏 Incríveis habilidades de QA! Você capturou a maioria dos erros do nosso desenvolvedor!" :
                   bugsFound.length >= 1 ? "👍 Bom esforço! Você capturou com sucesso alguns problemas difíceis!" :
                   "🧐 Continue praticando! Testar exige extrema precisão e paciência."}
                </p>
              </div>

              {/* Actions */}
              <div className="space-y-3.5 pt-4">
                <button
                  onClick={handleResetChallenge}
                  className="w-full bg-slate-900 border border-white/15 hover:bg-slate-800 rounded-xl py-3.5 text-xs font-bold uppercase tracking-widest cursor-pointer transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-4 h-4 text-slate-400" /> Iniciar Nova Sessão
                </button>
                
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide px-6">
                  Confira o ranking no painel da TV ao vivo para ver onde sua pontuação ficou!
                </p>
              </div>
            </div>

            {/* Bottom Footer logo */}
            <div className="pt-4 flex justify-center items-center gap-1">
              <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">MOTOROLA SOLUTIONS</span>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
