import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  LabelList, LineChart, Line,
  Radar, RadarChart, PolarGrid, PolarAngleAxis
} from 'recharts';
import './App.css';

// 커스텀 툴팁 컴포넌트
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        backgroundColor: 'rgba(17, 24, 39, 0.9)',
        backdropFilter: 'blur(8px)',
        border: '1px solid #3b82f6',
        borderRadius: '12px',
        padding: '12px 16px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
        color: '#f3f4f6',
        outline: 'none' // 테두리 방지
      }}>
        <p style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 'bold', color: '#9ca3af' }}>{label || '데이터'}</p>
        {payload.map((entry, index) => (
          <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: entry.color || entry.fill }}></div>
            <span style={{ fontSize: '14px', fontWeight: '600' }}>
              {entry.name === 'Blue' ? '블루 승리' : entry.name === 'Red' ? '레드 승리' : 
               entry.name === 'damage' ? '데미지' : entry.name === 'gold' ? '골드' : entry.name.toUpperCase()}: 
              <span style={{ marginLeft: '4px', color: '#fff' }}>{entry.value.toLocaleString()}</span>
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

function App() {
  const [matches, setMatches] = useState([]);
  const [playerStats, setPlayerStats] = useState([]);
  const [winLossStats, setWinLossStats] = useState({ Blue: 0, Red: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('damage'); 
  const [selectedMatchId, setSelectedMatchId] = useState(null);
  const [allStats, setAllStats] = useState([]); 
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [reportType, setReportType] = useState('dpm'); 
  const [selectedLine, setSelectedLine] = useState('ALL');
  const [openDates, setOpenDates] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { fetchInitialData(); }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const { data: mData } = await supabase.from('matches').select('*').order('match_date', { ascending: false });
      const { data: sDataTotal } = await supabase.from('match_stats').select('*, matches:match_id(*)');
      
      if (sDataTotal) setAllStats(sDataTotal);
      if (mData && mData.length > 0) {
        setMatches(mData);
        const stats = mData.reduce((acc, match) => {
          const winner = String(match.win_team || '').trim();
          if (winner === 'Blue') acc.Blue += 1;
          else if (winner === 'Red') acc.Red += 1;
          return acc;
        }, { Blue: 0, Red: 0 });
        setWinLossStats(stats);
        setSelectedMatchId(mData[0].id);
        fetchMatchStats(mData[0].id);
        setOpenDates({ [mData[0].match_date]: true });
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const fetchMatchStats = async (matchId) => {
    const { data: sData } = await supabase.from('match_stats').select('nickname, damage, gold').eq('match_id', matchId).order('damage', { ascending: false });
    if (sData) {
      setPlayerStats(sData.map(item => ({
        nickname: item.nickname || 'Unknown',
        damage: Number(item.damage || 0), gold: Number(item.gold || 0)
      })));
    }
  };

  const toggleDate = (date) => {
    setOpenDates(prev => ({ ...prev, [date]: !prev[date] }));
  };

  const groupedMatches = matches.reduce((acc, match) => {
    if (!acc[match.match_date]) acc[match.match_date] = [];
    acc[match.match_date].push(match);
    return acc;
  }, {});

  const searchResults = [...new Set(allStats.map(s => s.nickname))]
    .filter(name => name.toLowerCase().includes(searchTerm.toLowerCase()))
    .map(name => {
      const pHistory = allStats.filter(s => s.nickname === name);
      const wins = pHistory.filter(s => {
        const mySide = String(s.side || '').trim().toLowerCase();
        const winSide = String(s.matches?.win_team || '').trim().toLowerCase();
        return mySide !== "" && mySide === winSide;
      }).length;
      return {
        nickname: name,
        totalGames: pHistory.length,
        winRate: Math.round((wins / pHistory.length) * 100),
        mostLane: Object.entries(pHistory.reduce((acc, curr) => {
          const lane = String(curr.lane || 'MID').toUpperCase();
          acc[lane] = (acc[lane] || 0) + 1;
          return acc;
        }, {})).sort((a, b) => b[1] - a[1])[0][0]
      };
    });

  const handlePlayerClick = (nickname) => {
    const history = allStats.filter(s => s.nickname === nickname).map(s => {
      const mySide = String(s.side || '').trim().toLowerCase();
      const winSide = String(s.matches?.win_team || '').trim().toLowerCase();
      const [min, sec] = (s.matches?.duration || "20:00").split(':').map(Number);
      const mTotal = min + (sec / 60);
      const teamTotalKills = allStats.filter(st => st.match_id === s.match_id && st.side === s.side).reduce((sum, p) => sum + Number(p.kills || 0), 0);
      return {
        date: s.matches?.match_date || 'Unknown', lane: String(s.lane || 'MID').toUpperCase().trim(),
        dpm: Math.round(Number(s.damage || 0) / mTotal), gpm: Math.round(Number(s.gold || 0) / mTotal),
        cspm: (Number(s.cs || 0) / mTotal).toFixed(1), 
        vs: Number(s.vision_score || 0), // 🛠️ 분당(vspm)에서 경기당(vs)으로 변경
        dpg: Number(s.gold || 0) > 0 ? (Number(s.damage || 0) / Number(s.gold || 0)).toFixed(2) : "0.00",
        kp: teamTotalKills > 0 ? Math.round(((Number(s.kills || 0) + Number(s.assists || 0)) / teamTotalKills) * 100) : 0,
        isWin: mySide !== "" && mySide === winSide, damage: Number(s.damage || 0), gold: Number(s.gold || 0), cs: Number(s.cs || 0), vision_score: Number(s.vision_score || 0), matchMinutes: mTotal,
        kills: Number(s.kills || 0), deaths: Number(s.deaths || 0), assists: Number(s.assists || 0)
      };
    }).reverse();
    if (history.length > 0) {
      const lineSummary = history.reduce((acc, curr) => {
        if (!acc[curr.lane]) acc[curr.lane] = { count: 0, wins: 0 };
        acc[curr.lane].count++; if (curr.isWin) acc[curr.lane].wins++; return acc;
      }, {});
      setSelectedPlayer({ nickname, fullHistory: history, lineSummary });
      setSelectedLine('ALL');
      setSearchTerm(''); 
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }); 
    }
  };

  const getRankingsByLine = (nickname, field, line) => {
    if (!allStats.length) return null;
    const lineStats = line === 'ALL' ? allStats : allStats.filter(s => String(s.lane || '').toUpperCase().trim() === line);
    const nicknames = [...new Set(lineStats.map(s => s.nickname))];
    const rankingData = nicknames.map(name => {
      const pHistory = lineStats.filter(s => s.nickname === name);
      let tMin = 0, tDmg = 0, tGold = 0, tCs = 0, tVis = 0, tK = 0, tA = 0, tD = 0;
      pHistory.forEach(s => {
        const [min, sec] = (s.matches?.duration || "20:00").split(':').map(Number);
        const m = min + (sec / 60) || 20;
        tMin += m; tDmg += Number(s.damage || 0); tGold += Number(s.gold || 0);
        tCs += Number(s.cs || 0); tVis += Number(s.vision_score || 0);
        tK += Number(s.kills || 0); tA += Number(s.assists || 0); tD += Number(s.deaths || 0);
      });
      return { 
        nickname: name, 
        avgDpm: tDmg / (tMin || 1), 
        avgGpm: tGold / (tMin || 1), 
        avgCspm: tCs / (tMin || 1), 
        avgVs: tVis / (pHistory.length || 1), // 🛠️ 경기당 시야 점수 평균
        avgDpg: tGold > 0 ? tDmg / tGold : 0, 
        avgKda: tD === 0 ? (tK + tA) : (tK + tA) / tD 
      };
    });
    const sorted = [...rankingData].sort((a, b) => b[field] - a[field]);
    const rankIndex = sorted.findIndex(p => p.nickname === nickname);
    return rankIndex >= 0 && rankIndex < 3 ? { line: line === 'ALL' ? 'ALL' : line, rank: rankIndex + 1 } : null;
  };

  const getRadarData = (nickname, line) => {
    if (!allStats.length || line === 'ALL') return [];
    const lineStats = allStats.filter(s => String(s.lane || '').toUpperCase().trim() === line);
    const getAvg = (stats) => {
      let tMin = 0, tDmg = 0, tGold = 0, tCs = 0, tVis = 0, tK = 0, tA = 0, tD = 0;
      stats.forEach(s => {
        const [min, sec] = (s.matches?.duration || "20:00").split(':').map(Number);
        const m = min + (sec / 60) || 20;
        tMin += m; tDmg += Number(s.damage || 0); tGold += Number(s.gold || 0);
        tCs += Number(s.cs || 0); tVis += Number(s.vision_score || 0);
        tK += Number(s.kills || 0); tA += Number(s.assists || 0); tD += Number(s.deaths || 0);
      });
      const safeM = tMin > 0 ? tMin : 1;
      const count = stats.length > 0 ? stats.length : 1;
      return { DPM: tDmg / safeM, GPM: tGold / safeM, CSPM: tCs / safeM, VS: tVis / count, KDA: tD === 0 ? (tK + tA) : (tK + tA) / tD, DPG: tGold > 0 ? tDmg / tGold : 0 };
    };
    const lineAvg = getAvg(lineStats);
    const playerAvg = getAvg(lineStats.filter(s => s.nickname === nickname));
    // 🛠️ VS(시야) 기준점 상향 조정 (보통 경기당 30~60점 나오므로 70점 만점 기준)
    const maxRef = { DPM: 1000, GPM: 600, VS: 70, CSPM: 10, KDA: 5, DPG: 3.0 };
    const keys = [{ key: 'DPM', label: '전투' }, { key: 'GPM', label: '성장' }, { key: 'VS', label: '시야' }, { key: 'CSPM', label: '파밍' }, { key: 'KDA', label: '생존' }, { key: 'DPG', label: '효율' }];
    return keys.map(k => ({
      subject: k.label,
      player: Math.min(100, (playerAvg[k.key] / maxRef[k.key]) * 100),
      average: Math.min(100, (lineAvg[k.key] / maxRef[k.key]) * 100),
      actualPlayer: playerAvg[k.key].toFixed(2), actualAvg: lineAvg[k.key].toFixed(2)
    }));
  };

  const getFilteredData = () => {
    if (!selectedPlayer) return null;
    const filtered = selectedLine === 'ALL' ? selectedPlayer.fullHistory : selectedPlayer.fullHistory.filter(h => h.lane === selectedLine);
    const totalMinutes = filtered.reduce((acc, curr) => acc + curr.matchMinutes, 0);
    const totalD = filtered.reduce((acc, curr) => acc + curr.deaths, 0);
    const totalKA = filtered.reduce((acc, curr) => acc + curr.kills + curr.assists, 0);
    const safeM = totalMinutes > 0 ? totalMinutes : 1;
    const count = filtered.length > 0 ? filtered.length : 1;
    return {
      history: filtered,
      avgDpm: Math.round(filtered.reduce((acc, curr) => acc + curr.damage, 0) / safeM),
      avgGpm: Math.round(filtered.reduce((acc, curr) => acc + curr.gold, 0) / safeM),
      avgCspm: (filtered.reduce((acc, curr) => acc + curr.cs, 0) / safeM).toFixed(1),
      avgVs: Math.round(filtered.reduce((acc, curr) => acc + curr.vision_score, 0) / count), // 🛠️ 경기당 시야 점수 평균
      avgDpg: filtered.reduce((acc, curr) => acc + curr.gold, 0) > 0 ? (filtered.reduce((acc, curr) => acc + curr.damage, 0) / filtered.reduce((acc, curr) => acc + curr.gold, 0)).toFixed(2) : "0.00",
      avgKp: filtered.length > 0 ? Math.round(filtered.reduce((acc, curr) => acc + curr.kp, 0) / filtered.length) : 0,
      winRate: filtered.length > 0 ? Math.round((filtered.filter(h => h.isWin).length / filtered.length) * 100) : 0,
      kda: totalD === 0 ? (totalKA > 0 ? "Perfect" : "0.00") : (totalKA / totalD).toFixed(2)
    };
  };

  const currentData = getFilteredData();
  const radarData = selectedPlayer ? getRadarData(selectedPlayer.nickname, selectedLine) : [];
  const pieData = [{ name: 'Blue', value: winLossStats.Blue, color: '#3b82f6' }, { name: 'Red', value: winLossStats.Red, color: '#ef4444' }];

  if (loading) return <div style={{ color: '#fff', textAlign: 'center', marginTop: '100px' }}>데이터 로딩 중...</div>;

  return (
    /* 🛠️ 전체 배경색 및 여백 제거 스타일 적용 */
    <div style={{ backgroundColor: '#0a0e17', minHeight: '100vh', width: '100%', margin: 0, padding: 0, color: '#f3f4f6', overflowX: 'hidden' }}>
      <header style={{ 
        textAlign: 'center', 
        padding: '80px 0 40px 0',
        background: 'linear-gradient(to bottom, #1e293b 0%, #0a0e17 100%)',
        borderBottom: '1px solid #1e293b',
        marginBottom: '40px'
      }}>
        <div style={{ display: 'inline-block', paddingBottom: '10px' }}>
          <h1 style={{ fontSize: '52px', fontWeight: '900', margin: '0', lineHeight: '1.25',display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
            <span style={{ background: 'linear-gradient(180deg, #ffffff 30%, #a1a1aa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>방주</span>
            <span style={{ color: '#3b82f6', fontStyle: 'italic', textShadow: '0 0 25px rgba(59, 130, 246, 0.4)' }}>.GG</span>
          </h1>
        </div>
      </header>

      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '30px', padding: '0 20px 100px 20px' }}>
        
        <section style={{ backgroundColor: '#1f2937', padding: '30px', borderRadius: '20px', border: '1px solid #374151', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '600px' }}>
            <input 
              type="text" 
              placeholder="플레이어 닉네임을 검색하세요" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', backgroundColor: '#111827', border: '2px solid #3b82f6', borderRadius: '12px', padding: '15px 20px', color: '#fff', fontSize: '16px', outline: 'none' }}
            />
            <span style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
          </div>

          {searchTerm && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px', width: '100%' }}>
              {searchResults.map(player => (
                <div key={player.nickname} onClick={() => handlePlayerClick(player.nickname)} style={{ backgroundColor: '#111827', padding: '15px', borderRadius: '12px', border: '1px solid #374151', cursor: 'pointer' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '15px', marginBottom: '5px' }}>{player.nickname}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#9ca3af' }}>
                    <span>{player.mostLane}</span>
                    <span style={{ color: player.winRate >= 50 ? '#3b82f6' : '#ef4444' }}>{player.winRate}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
          <section style={{ backgroundColor: '#1f2937', padding: '25px', borderRadius: '16px', maxHeight: '350px', display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ fontSize: '18px', marginBottom: '20px', color: '#ffffff' }}>⚔️ 경기 기록</h2>
            <div className="custom-scroll" style={{ overflowY: 'auto', gap: '8px', display: 'flex', flexDirection: 'column' }}>
              {Object.keys(groupedMatches).map(date => (
                <div key={date}>
                  <div onClick={() => toggleDate(date)} style={{ padding: '12px 15px', backgroundColor: '#111827', borderRadius: '10px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #374151', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '14px' }}>📅 {date}</span>
                    <span style={{ fontSize: '12px', color: '#9ca3af' }}>{groupedMatches[date].length}경기 {openDates[date] ? '▲' : '▼'}</span>
                  </div>
                  {openDates[date] && (
                    <div style={{ paddingLeft: '10px', display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '10px' }}>
                      {groupedMatches[date].map(m => (
                        <div key={m.id} onClick={() => { setSelectedMatchId(m.id); fetchMatchStats(m.id); }} style={{ padding: '12px', borderRadius: '8px', cursor: 'pointer', backgroundColor: selectedMatchId === m.id ? '#374151' : '#111827', borderLeft: `4px solid ${m.win_team === 'Blue' ? '#3b82f6' : '#ef4444'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', border: '1px solid #1f2937' }}>
                          <span style={{ color: m.win_team === 'Blue' ? '#60a5fa' : '#f87171', fontWeight: 'bold' }}>{m.win_team} 승</span>
                          <span style={{ color: '#6b7280', fontSize: '13px' }}>({m.duration})</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section style={{ backgroundColor: '#1f2937', padding: '25px', borderRadius: '16px', position: 'relative', height: '350px', display: 'flex', flexDirection: 'column', alignItems: 'center', outline: 'none' }}>
            <h2 style={{ fontSize: '18px', marginBottom: '10px', width: '100%', color: '#ffffff' }}>📊 진영 승률</h2>
            {/* 🛠️ 클릭 시 테두리 제거 (outline: none) */}
            <ResponsiveContainer width="100%" height={220} style={{ outline: 'none' }}>
              <PieChart style={{ outline: 'none' }}>
                <Pie data={pieData} innerRadius={70} outerRadius={90} paddingAngle={5} dataKey="value" stroke="none" style={{ outline: 'none' }}>
                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} style={{ outline: 'none' }} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: 'absolute', top: '75%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#9ca3af' }}>Blue 승률</div>
              <div style={{ fontSize: '32px', fontWeight: '900', color: '#3b82f6' }}>{matches.length > 0 ? Math.round((winLossStats.Blue / matches.length) * 100) : 0}%</div>
            </div>
          </section>
        </div>

        <section style={{ backgroundColor: '#1f2937', padding: '35px', borderRadius: '16px', outline: 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffffff' }}>플레이어 상세 지표 (전체 순위)</h2>
            <div style={{ backgroundColor: '#111827', padding: '5px', borderRadius: '10px', display: 'flex', gap: '5px' }}>
              {['damage', 'gold'].map(t => (
                <button key={t} onClick={() => setActiveTab(t)} style={{ padding: '10px 25px', borderRadius: '8px', border: 'none', cursor: 'pointer', backgroundColor: activeTab === t ? (t === 'damage' ? '#e97171' : '#fbbf24') : 'transparent', color: activeTab === t && t === 'gold' ? '#000' : '#fff' }}>{t === 'damage' ? '데미지' : '골드'}</button>
              ))}
            </div>
          </div>
          <ResponsiveContainer height={350} style={{ outline: 'none' }}>
            <BarChart data={playerStats} margin={{ bottom: 0 }} style={{ outline: 'none' }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
              <XAxis dataKey="nickname" stroke="#9ca3af" interval={0} angle={0} dy={10} textAnchor="middle" height={80} tick={{ fontSize: 13 }} />
              <YAxis stroke="#9ca3af"  tick={{ fontSize: 13, verticalAnchor: "middle"}} tickMargin={10}/>
              <ReTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
              <Bar dataKey={activeTab} fill={activeTab === 'damage' ? '#e97171' : '#fbbf24'} radius={[6, 6, 0, 0]} barSize={30} onClick={(d) => handlePlayerClick(d.nickname)} style={{ cursor: 'pointer', outline: 'none' }}>
                <LabelList dataKey={activeTab} position="top" fill="#9ca3af" dy={-2} fontSize={10} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </section>

        {selectedPlayer && currentData && (
          <section id="player-report" style={{ backgroundColor: '#1f2937', padding: '35px', borderRadius: '16px', border: '2px solid #3b82f6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: '#60a5fa' }}>👤 {selectedPlayer.nickname} 분석 리포트</h2>
              <button onClick={() => setSelectedPlayer(null)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '20px' }}>✕</button>
            </div>
            
            <div style={{ display: 'flex', gap: '10px', marginBottom: '25px' }}>
              <LineTab label="전체" active={selectedLine === 'ALL'} count={selectedPlayer.fullHistory.length} onClick={() => setSelectedLine('ALL')} />
              {['TOP', 'JNG', 'MID', 'ADC', 'SUP'].map(lane => selectedPlayer.lineSummary[lane] && (
                <LineTab key={lane} label={lane} active={selectedLine === lane} count={selectedPlayer.lineSummary[lane].count} winRate={Math.round((selectedPlayer.lineSummary[lane].wins / selectedPlayer.lineSummary[lane].count) * 100)} onClick={() => setSelectedLine(lane)} />
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '25px' }}>
              <StatItem label="평균 KDA" value={currentData.kda} color="#10b981" rank={getRankingsByLine(selectedPlayer.nickname, 'avgKda', selectedLine)} />
              <StatItem label="승률" value={`${currentData.winRate}%`} color="#3b82f6" />
              <StatItem label="평균 KP%" value={`${currentData.avgKp}%`} color="#f472b6" />
              <StatItem label="골드당 데미지" value={currentData.avgDpg} color="#ec4899" rank={getRankingsByLine(selectedPlayer.nickname, 'avgDpg', selectedLine)} />
              <StatItem label="평균 DPM" value={currentData.avgDpm} color="#8b5cf6" rank={getRankingsByLine(selectedPlayer.nickname, 'avgDpm', selectedLine)} />
              <StatItem label="평균 GPM" value={currentData.avgGpm} color="#fbbf24" rank={getRankingsByLine(selectedPlayer.nickname, 'avgGpm', selectedLine)} />
              {/* 🛠️ 라벨명 변경 및 평균값 반영 */}
              <StatItem label="평균 시야 점수" value={currentData.avgVs} color="#60a5fa" rank={getRankingsByLine(selectedPlayer.nickname, 'avgVs', selectedLine)} />
              <StatItem label="평균 CSPM" value={currentData.avgCspm} color="#10b981" rank={getRankingsByLine(selectedPlayer.nickname, 'avgCspm', selectedLine)} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: selectedLine === 'ALL' ? '1fr' : '1.2fr 0.8fr', gap: '20px' }}>
              <div style={{ backgroundColor: '#111827', padding: '25px', borderRadius: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '14px', color: '#9ca3af' }}>📊 {selectedLine} {reportType.toUpperCase()} 추이</h3>
                  <div style={{ backgroundColor: '#1f2937', padding: '4px', borderRadius: '8px', display: 'flex', gap: '4px' }}>
                    {['dpm', 'gpm', 'cspm', 'vs', 'dpg'].map(type => (
                      <button key={type} onClick={() => setReportType(type)} style={{ padding: '6px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '10px', backgroundColor: reportType === type ? '#3b82f6' : 'transparent', color: '#fff' }}>{type.toUpperCase()}</button>
                    ))}
                  </div>
                </div>
                <ResponsiveContainer height={250} style={{ outline: 'none' }}>
                  <LineChart data={currentData.history} style={{ outline: 'none' }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                    <XAxis dataKey="date" stroke="#9ca3af" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#9ca3af" tick={{ fontSize: 13 }}/>
                    <ReTooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey={reportType === 'vs' ? 'vs' : reportType} stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {selectedLine !== 'ALL' && (
                <div style={{ backgroundColor: '#111827', padding: '25px', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '15px' }}>💠 {selectedLine} 평균 대비 성향</h3>
                  <ResponsiveContainer width="100%" height={230} style={{ outline: 'none' }}>
                    <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData} style={{ outline: 'none' }}>
                      <PolarGrid stroke="#374151" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                      <Radar name="내 지표" dataKey="player" stroke="#f97316" fill="#f97316" fillOpacity={0.5} />
                      <Radar name="라인 평균" dataKey="average" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

// 서브 컴포넌트들 (변경 없음)
const LineTab = ({ label, active, count, winRate, onClick }) => (
  <div onClick={onClick} style={{ minWidth: '90px', padding: '10px', borderRadius: '12px', cursor: 'pointer', textAlign: 'center', backgroundColor: active ? '#3b82f6' : '#111827', border: active ? '1px solid #60a5fa' : '1px solid #374151', color: active ? '#fff' : '#9ca3af' }}>
    <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{label}</div>
    <div style={{ fontSize: '11px', opacity: 0.8 }}>{count}판 {winRate !== undefined && `(${winRate}%)`}</div>
  </div>
);

const StatItem = ({ label, value, color, rank }) => {
  const getOrdinal = (n) => n + (["th", "st", "nd", "rd"][(n % 100 > 10 && n % 100 < 14) ? 0 : Math.min(n % 10, 3)]);
  let border = '1px solid #374151';
  if (rank) {
    if (rank.rank === 1) border = '2px solid #fbbf24';
    else if (rank.rank === 2) border = '2px solid #94a3b8';
    else if (rank.rank === 3) border = '2px solid #92400e';
  }
  return (
    <div style={{ backgroundColor: '#111827', padding: '15px', borderRadius: '12px', textAlign: 'center', position: 'relative', border }}>
      {rank && (
        <div style={{ position: 'absolute', top: '5px', left: '5px', backgroundColor: rank.rank === 1 ? '#fbbf24' : rank.rank === 2 ? '#94a3b8' : '#92400e', color: rank.rank === 1 ? '#000' : '#fff', fontSize: '8px', padding: '2px 5px', borderRadius: '4px', fontWeight: 'bold' }}>
          {rank.line === 'ALL' ? `ALL ${getOrdinal(rank.rank)}` : `${rank.line} ${getOrdinal(rank.rank)}`}
        </div>
      )}
      <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '6px' }}>{label}</p>
      <p style={{ fontSize: '17px', fontWeight: 'bold', color }}>{value}</p>
    </div>
  );
};

export default App;