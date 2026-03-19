import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  LabelList, LineChart, Line,
  Radar, RadarChart, PolarGrid, PolarAngleAxis
} from 'recharts';
import './App.css';

const laneOrder = { 
  'TOP': 1, 'JNG': 2, 'JUNGLE': 2, 'MID': 3, 'ADC': 4, 'BOT': 4, 'SUP': 5, 'SUPPORT': 5 
};

// --- 이미지 URL 생성 유틸리티 ---
const getChampImgUrl = (enId) => {
  if (!enId) return 'https://ddragon.leagueoflegends.com/cdn/13.24.1/img/champion/tiles/Empty_0.jpg';
  const formattedId = enId.charAt(0).toUpperCase() + enId.slice(1);
  return `https://ddragon.leagueoflegends.com/cdn/img/champion/tiles/${formattedId}_0.jpg`;
};

/* --- 1. 유틸리티 컴포넌트 & 커스텀 툴팁 --- */
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        backgroundColor: 'rgba(17, 24, 39, 0.9)', backdropFilter: 'blur(8px)',
        border: '1px solid #3b82f6', borderRadius: '12px', padding: '12px 16px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)', color: '#f3f4f6', outline: 'none'
      }}>
        <p style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 'bold', color: '#9ca3af' }}>{label || '데이터'}</p>
        {payload.map((entry, index) => (
          <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: entry.color || entry.fill }}></div>
            <span style={{ fontSize: '14px', fontWeight: '600' }}>
              {entry.name === 'Blue' ? '블루 승리' : entry.name === 'Red' ? '레드 승리' : 
               entry.name === 'damage' ? '데미지' : entry.name === 'gold' ? '골드' : 
               entry.name === 'vision_score' ? '시야 점수' : entry.name === 'control_wards' ? '제어 와드' : 
               entry.name === 'damage_taken' ? '받은 데미지' : entry.name === 'dtpm' ? 'DTPM' :
               entry.name === 'cs' ? 'CS' : entry.name.toUpperCase()}: 
              <span style={{ marginLeft: '4px', color: '#fff' }}>{entry.value.toLocaleString()}</span>
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const RadarCustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const pVal = parseFloat(data.actualPlayer);
    const aVal = parseFloat(data.actualAvg);
    const diff = aVal !== 0 ? ((pVal - aVal) / aVal * 100).toFixed(1) : 0;
    const isHigher = diff >= 0;

    return (
      <div style={{
        backgroundColor: 'rgba(17, 24, 39, 0.95)', backdropFilter: 'blur(8px)',
        border: '1px solid #f97316', borderRadius: '10px', padding: '10px 14px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)', color: '#fff'
      }}>
        <p style={{ margin: '0 0 6px 0', fontSize: '14px', fontWeight: 'bold', color: '#f97316' }}>{data.subject}</p>
        <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px' }}>
            <span style={{ color: '#9ca3af' }}>내 수치:</span>
            <span style={{ fontWeight: 'bold' }}>{data.actualPlayer}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px' }}>
            <span style={{ color: '#9ca3af' }}>라인 평균:</span>
            <span style={{ fontWeight: 'bold' }}>{data.actualAvg}</span>
          </div>
          <div style={{ 
            marginTop: '4px', paddingTop: '4px', borderTop: '1px solid #374151',
            color: isHigher ? '#60a5fa' : '#ef4444', fontWeight: 'bold', textAlign: 'center' 
          }}>
            평균 대비 {isHigher ? `+${diff}% ▲` : `${diff}% ▼`}
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const getMultiKillLabel = (count) => {
  if (!count || count === 'None' || count === 0 || count === '0') return null;
  const mapping = { 2: '더블킬', 3: '트리플킬', 4: '쿼드라킬', 5: '펜타킬', 'Double': '더블킬', 'Triple': '트리플킬', 'Quadra': '쿼드라킬', 'Penta': '펜타킬' };
  return mapping[count] || (typeof count === 'string' ? count.toUpperCase() : null);
};

const Badge = ({ label, color }) => (
  <span style={{ 
    backgroundColor: color, color: '#fff', fontSize: '10px', fontWeight: '900', padding: '1px 6px', 
    borderRadius: '4px', textTransform: 'uppercase', whiteSpace: 'nowrap', boxShadow: `0 0 8px ${color}44`, letterSpacing: '0.5px'
  }}>{label}</span>
);

/* --- 2. 메인 앱 컴포넌트 --- */
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
  const [dataScope, setDataScope] = useState('ALL');
  const [selectedChampion, setSelectedChampion] = useState(null);

  useEffect(() => { fetchInitialData(); }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const { data: mData } = await supabase.from('matches').select('*').order('match_date', { ascending: false });
      const { data: sDataTotal } = await supabase.from('match_stats').select('*, champion, match_id, matches:match_id(*)')
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
    try {
      // 400 에러 해결: champion 컬럼으로 정확히 요청
      const { data: sData, error } = await supabase.from('match_stats').select('nickname, damage, gold, vision_score, control_wards, damage_taken, cs, kills, deaths, assists, side, first_blood, multi_kill, lane, champion').eq('match_id', matchId);
      if (error) throw error;
      if (sData) {
        const sortedData = sData.sort((a, b) => (laneOrder[String(a.lane || 'MID').toUpperCase()] || 99) - (laneOrder[String(b.lane || 'MID').toUpperCase()] || 99));
        setPlayerStats(sortedData.map(item => ({
          nickname: item.nickname || 'Unknown', 
          damage: Number(item.damage || 0), 
          gold: Number(item.gold || 0), 
          vision_score: Number(item.vision_score || 0), 
          control_wards: Number(item.control_wards || 0), 
          damage_taken: Number(item.damage_taken || 0), 
          cs: Number(item.cs || 0), 
          kills: Number(item.kills || 0), 
          deaths: Number(item.deaths || 0), 
          assists: Number(item.assists || 0), 
          side: item.side, 
          firstBlood: item.first_blood, 
          multiKill: item.multi_kill, 
          lane: item.lane,
          champion: item.champion
        })));
      }
    } catch (err) { console.error(err); }
  };

  // ... (기본 데이터 처리 로직들: handlePlayerClick, getRankingsByLine, getRadarData, getFilteredData 등 동일)
  const handlePlayerClick = (nickname) => {
    try {
      const history = allStats.filter(s => s.nickname === nickname).map(s => {
        // 1. 진영 데이터 안전하게 추출
        const mySide = String(s.side || '').trim().toLowerCase();
        // ★ 중요: s.matches가 존재할 때만 win_team을 가져옵니다.
        const winSide = String(s.matches?.win_team || '').trim().toLowerCase();
        
        // 2. 시간 계산 (에러 방지용 기본값 20:00 설정)
        const [min, sec] = (s.matches?.duration || "20:00").split(':').map(Number);
        const mTotal = (min || 20) + (sec / 60 || 0);

        // 3. 팀 통계 집계
        const teamStats = allStats.filter(st => st.match_id === s.match_id && st.side === s.side);
        const teamTotalDmg = teamStats.reduce((sum, p) => sum + Number(p.damage || 0), 0);
        const teamTotalKills = teamStats.reduce((sum, p) => sum + Number(p.kills || 0), 0);

        // 4. 승리 여부 판단
        const isWinResult = mySide !== "" && winSide !== "" && mySide === winSide;

        return { 
          date: s.matches?.match_date || 'Unknown', 
          lane: String(s.lane || 'MID').toUpperCase().trim(), 
          champion: s.champion, 
          match_id: s.match_id,
          isWin: isWinResult, // 승률 계산의 핵심
          dpm: Math.round(Number(s.damage || 0) / mTotal), 
          dtpm: Math.round(Number(s.damage_taken || 0) / mTotal),
          dmgShare: teamTotalDmg > 0 ? Number(((Number(s.damage || 0) / teamTotalDmg) * 100).toFixed(1)) : 0,
          gpm: Math.round(Number(s.gold || 0) / mTotal), 
          cspm: (Number(s.cs || 0) / mTotal).toFixed(1), 
          vs: Number(s.vision_score || 0), 
          controlWards: Number(s.control_wards || 0),
          isFB: s.first_blood === true || s.first_blood === 'true' || s.first_blood === 1,
          dpg: Number(s.gold || 0) > 0 ? (Number(s.damage || 0) / Number(s.gold || 0)).toFixed(2) : "0.00", 
          kp: teamTotalKills > 0 ? Math.round(((Number(s.kills || 0) + Number(s.assists || 0)) / teamTotalKills) * 100) : 0,
          damage: Number(s.damage || 0), 
          damage_taken: Number(s.damage_taken || 0), 
          gold: Number(s.gold || 0), 
          cs: Number(s.cs || 0), 
          vision_score: Number(s.vision_score || 0), 
          matchMinutes: mTotal, 
          kills: Number(s.kills || 0), 
          deaths: Number(s.deaths || 0), 
          assists: Number(s.assists || 0) 
        };
      }).reverse();

      if (history.length > 0) {
        const lineSummary = history.reduce((acc, curr) => { 
          if (!acc[curr.lane]) acc[curr.lane] = { count: 0, wins: 0 }; 
          acc[curr.lane].count++; 
          if (curr.isWin) acc[curr.lane].wins++; 
          return acc; 
        }, {});

        setSelectedPlayer({ nickname, fullHistory: history, lineSummary });
        setSelectedLine('ALL'); 
        setDataScope('ALL'); 
        setSearchTerm(''); 
        
        // 리포트로 부드럽게 스크롤
        setTimeout(() => {
          window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        }, 100);
      }
    } catch (error) {
      console.error("리포트 생성 중 에러 발생:", error);
      alert("데이터 처리 중 오류가 발생했습니다. 콘솔을 확인해주세요.");
    }
  };

  const getRankingsByLine = (nickname, field, line) => {
    if (!allStats.length) return null;
    const lineStats = line === 'ALL' ? allStats : allStats.filter(s => String(s.lane || '').toUpperCase().trim() === line);
    const nicknames = [...new Set(lineStats.map(s => s.nickname))];
    const rankingData = nicknames.map(name => {
      const pHistory = lineStats.filter(s => s.nickname === name);
      let tMin = 0, tDmg = 0, tGold = 0, tCs = 0, tVis = 0, tK = 0, tA = 0, tD = 0;
      let tDtpm = 0, tDmgShare = 0, tFB = 0, tCW = 0, tKpSum = 0;
      pHistory.forEach(s => { 
        const [min, sec] = (s.matches?.duration || "20:00").split(':').map(Number); 
        const m = min + (sec / 60) || 20; tMin += m; 
        tDmg += Number(s.damage || 0); tGold += Number(s.gold || 0); tCs += Number(s.cs || 0); 
        tVis += Number(s.vision_score || 0); tK += Number(s.kills || 0); tA += Number(s.assists || 0); tD += Number(s.deaths || 0);
        tDtpm += Number(s.damage_taken || 0); tCW += Number(s.control_wards || 0);
        if (s.first_blood === true || s.first_blood === 'true' || s.first_blood === 1) tFB += 1;
        const teamStats = allStats.filter(st => st.match_id === s.match_id && st.side === s.side);
        const teamDmg = teamStats.reduce((sum, p) => sum + Number(p.damage || 0), 0);
        const teamKills = teamStats.reduce((sum, p) => sum + Number(p.kills || 0), 0);
        tDmgShare += teamDmg > 0 ? (Number(s.damage || 0) / teamDmg) : 0;
        tKpSum += teamKills > 0 ? ((Number(s.kills || 0) + Number(s.assists || 0)) / teamKills) : 0;
      });
      return { 
        nickname: name, avgDpm: tDmg / (tMin || 1), avgGpm: tGold / (tMin || 1), avgCspm: tCs / (tMin || 1), 
        avgVs: tVis / (pHistory.length || 1), avgDpg: tGold > 0 ? tDmg / tGold : 0, 
        avgKda: tD === 0 ? (tK + tA) : (tK + tA) / tD,
        avgDtpm: tDtpm / (tMin || 1), avgDmgShare: (tDmgShare / (pHistory.length || 1)) * 100,
        fbRate: (tFB / (pHistory.length || 1)) * 100, avgControlWards: tCW / (pHistory.length || 1),
        avgKp: (tKpSum / (pHistory.length || 1)) * 100
      };
    });
    const sorted = [...rankingData].sort((a, b) => b[field] - a[field]);
    const rankIndex = sorted.findIndex(p => p.nickname === nickname);
    return rankIndex >= 0 && rankIndex < 3 ? { line: line === 'ALL' ? 'ALL' : line, rank: rankIndex + 1 } : null;
  };

  const getRadarData = (nickname, line) => {
    if (!allStats.length || line === 'ALL') return [];
    let lineStats = allStats.filter(s => String(s.lane || '').toUpperCase().trim() === line);
    let playerStatsInLine = lineStats.filter(s => s.nickname === nickname);
    if (dataScope === 'RECENT') playerStatsInLine = playerStatsInLine.slice(0, 10);
    const calculateAvgs = (stats) => {
      let tMin = 0, tDmg = 0, tGold = 0, tCs = 0, tVis = 0, tK = 0, tA = 0, tD = 0;
      stats.forEach(s => { 
        const [min, sec] = (s.matches?.duration || "20:00").split(':').map(Number); 
        const m = min + (sec / 60) || 20; tMin += m; tDmg += Number(s.damage || 0); tGold += Number(s.gold || 0); tCs += Number(s.cs || 0); 
        tVis += Number(s.vision_score || 0); tK += Number(s.kills || 0); tA += Number(s.assists || 0); tD += Number(s.deaths || 0); 
      });
      const safeM = tMin > 0 ? tMin : 1; const count = stats.length > 0 ? stats.length : 1;
      return { DPM: tDmg / safeM, GPM: tGold / safeM, CSPM: tCs / safeM, VS: tVis / count, KDA: tD === 0 ? (tK + tA) : (tK + tA) / tD, DPG: tGold > 0 ? tDmg / tGold : 0 };
    };
    const lineActual = calculateAvgs(lineStats);
    const playerActual = calculateAvgs(playerStatsInLine);
    const keys = [{ key: 'DPM', label: '전투' }, { key: 'GPM', label: '성장' }, { key: 'VS', label: '시야' }, { key: 'CSPM', label: '파밍' }, { key: 'KDA', label: '생존' }, { key: 'DPG', label: '효율' }];
    return keys.map(k => {
      const lAvg = lineActual[k.key] || 1; const pAvg = playerActual[k.key] || 0;
      const playerPoint = Math.min(100, (pAvg / lAvg) * 50); 
      return { subject: k.label, player: playerPoint, average: 50, actualPlayer: pAvg.toFixed(k.key === 'CSPM' || k.key === 'DPG' ? 2 : 1), actualAvg: lAvg.toFixed(k.key === 'CSPM' || k.key === 'DPG' ? 2 : 1) };
    });
  };

  const getFilteredData = () => {
    if (!selectedPlayer) return null;
    let baseData = selectedLine === 'ALL' ? selectedPlayer.fullHistory : selectedPlayer.fullHistory.filter(h => h.lane === selectedLine);
    if (selectedChampion) {
    baseData = baseData.filter(h => h.champion === selectedChampion);
  }
    if (dataScope === 'RECENT') baseData = baseData.slice(0, 10);
    const filtered = baseData;
    const totalMinutes = filtered.reduce((acc, curr) => acc + curr.matchMinutes, 0);
    const totalD = filtered.reduce((acc, curr) => acc + curr.deaths, 0);
    const totalKA = filtered.reduce((acc, curr) => acc + curr.kills + curr.assists, 0);
    const safeM = totalMinutes > 0 ? totalMinutes : 1; const count = filtered.length > 0 ? filtered.length : 1;
    return { 
      history: filtered, 
      avgDpm: Math.round(filtered.reduce((acc, curr) => acc + curr.damage, 0) / safeM), 
      avgDtpm: Math.round(filtered.reduce((acc, curr) => acc + curr.damage_taken, 0) / safeM), 
      avgDmgShare: (filtered.reduce((acc, curr) => acc + curr.dmgShare, 0) / count).toFixed(1), 
      fbRate: Math.round((filtered.filter(h => h.isFB).length / count) * 100), 
      avgControlWards: (filtered.reduce((acc, curr) => acc + curr.controlWards, 0) / count).toFixed(1), 
      avgGpm: Math.round(filtered.reduce((acc, curr) => acc + curr.gold, 0) / safeM), 
      avgCspm: (filtered.reduce((acc, curr) => acc + curr.cs, 0) / safeM).toFixed(1), 
      avgVs: Math.round(filtered.reduce((acc, curr) => acc + curr.vision_score, 0) / count), 
      avgDpg: filtered.reduce((acc, curr) => acc + curr.gold, 0) > 0 ? (filtered.reduce((acc, curr) => acc + curr.damage, 0) / filtered.reduce((acc, curr) => acc + curr.gold, 0)).toFixed(2) : "0.00", 
      avgKp: filtered.length > 0 ? Math.round(filtered.reduce((acc, curr) => acc + curr.kp, 0) / filtered.length) : 0, 
      winRate: filtered.length > 0 ? Math.round((filtered.filter(h => h.isWin).length / filtered.length) * 100) : 0, 
      kda: totalD === 0 ? (totalKA > 0 ? "Perfect" : "0.00") : (totalKA / totalD).toFixed(2) 
    };
  };

  const currentData = getFilteredData();
  const radarData = selectedPlayer ? getRadarData(selectedPlayer.nickname, selectedLine) : [];
  const searchResults = [...new Set(allStats.map(s => s.nickname))]
    .filter(name => name.toLowerCase().includes(searchTerm.toLowerCase()))
    .map(name => {
      const pHistory = allStats.filter(s => s.nickname === name);
      const wins = pHistory.filter(s => String(s.side || '').trim().toLowerCase() === String(s.matches?.win_team || '').trim().toLowerCase()).length;
      return { nickname: name, totalGames: pHistory.length, winRate: Math.round((wins / pHistory.length) * 100), mostLane: Object.entries(pHistory.reduce((acc, curr) => { const lane = String(curr.lane || 'MID').toUpperCase(); acc[lane] = (acc[lane] || 0) + 1; return acc; }, {})).sort((a, b) => b[1] - a[1])[0][0] };
    });

  const toggleDate = (date) => { setOpenDates(prev => ({ ...prev, [date]: !prev[date] })); };
  const groupedMatches = matches.reduce((acc, match) => {
    if (!acc[match.match_date]) acc[match.match_date] = [];
    acc[match.match_date].push(match);
    return acc;
  }, {});

  if (loading) return <div style={{ color: '#fff', textAlign: 'center', marginTop: '100px' }}>데이터 로딩 중...</div>;

  return (
    <div style={{ backgroundColor: '#0a0e17', minHeight: '100vh', width: '100%', margin: 0, padding: 0, color: '#f3f4f6', overflowX: 'hidden' }}>
      <header style={{ textAlign: 'center', padding: '100px 0 60px 0', background: 'linear-gradient(to bottom, #1e293b 0%, #0a0e17 100%)', borderBottom: '1px solid #1e293b', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '64px', fontWeight: '900', margin: '0', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', lineHeight: '1.2' }}>
          <span style={{ background: 'linear-gradient(180deg, #ffffff 30%, #a1a1aa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>방주</span>
          <span style={{ color: '#3b82f6', fontStyle: 'italic', textShadow: '0 0 30px rgba(59, 130, 246, 0.6)' }}>.GG</span>
        </h1>
      </header>

      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '30px', padding: '0 20px 100px 20px' }}>
        
        {/* 검색 섹션 */}
        <section style={{ backgroundColor: '#1f2937', padding: '30px', borderRadius: '20px', border: '1px solid #374151', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '600px' }}>
            <input type="text" placeholder="플레이어 닉네임을 검색하세요" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '100%', backgroundColor: '#111827', border: '2px solid #3b82f6', borderRadius: '12px', padding: '15px 20px', color: '#fff', fontSize: '16px', outline: 'none' }} />
          </div>
          {searchTerm && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px', width: '100%' }}>
              {searchResults.map(player => (
                <div key={player.nickname} onClick={() => handlePlayerClick(player.nickname)} style={{ backgroundColor: '#111827', padding: '15px', borderRadius: '12px', border: '1px solid #374151', cursor: 'pointer' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '15px', marginBottom: '5px' }}>{player.nickname}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#9ca3af' }}><span>{player.mostLane}</span><span style={{ color: player.winRate >= 50 ? '#3b82f6' : '#ef4444' }}>{player.winRate}%</span></div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 상단 요약/승률 카드 */}
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
          <section style={{ backgroundColor: '#1f2937', padding: '25px', borderRadius: '16px', position: 'relative', height: '350px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h2 style={{ fontSize: '18px', marginBottom: '10px', width: '100%', color: '#ffffff' }}>📊 진영 승률</h2>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={[{ name: 'Blue', value: winLossStats.Blue }, { name: 'Red', value: winLossStats.Red }]} innerRadius={70} outerRadius={100}  paddingAngle={3} dataKey="value" stroke="none">
                  <Cell fill="#3b82f6" /><Cell fill="#ef4444" />
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: 'absolute', top: '80%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '12px' }}>Blue 승률</div>
              <div style={{ fontSize: '42px', fontWeight: '900', color: '#3b82f6' }}>{matches.length > 0 ? Math.round((winLossStats.Blue / matches.length) * 100) : 0}%</div>
            </div>
          </section>
        </div>

        {/* 경기 상세 테이블 (레이아웃 & 밴 데이터 연동 수정본) */}
{selectedMatchId && playerStats.length > 0 && (
  <section style={{ 
    display: 'grid', 
    gridTemplateColumns: '1fr 1fr', // 좌우 2컬럼 고정
    gap: '20px',
    marginTop: '20px'
  }}>
    {['Blue', 'Red'].map(side => {
      // 현재 선택된 경기 데이터 찾기
      const currentMatch = matches.find(m => m.id === selectedMatchId);
      // 데이터 구조에 맞춰 밴 목록 추출 (image_d33a84.png 참고)
      const bans = side === 'Blue' ? (currentMatch?.blue_bans || []) : (currentMatch?.red_bans || []);

      return (
        <div key={side} style={{ 
          backgroundColor: '#1f2937', 
          borderRadius: '16px', 
          overflow: 'hidden', 
          border: `1px solid ${side === 'Blue' ? '#3b82f6' : '#ef4444'}` 
        }}>
          {/* 팀 헤더 - 문법 에러 해결 */}
          <div style={{ 
            backgroundColor: side === 'Blue' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(239, 68, 68, 0.15)', 
            padding: '12px 20px', 
            borderBottom: '1px solid #374151' 
          }}>
            <span style={{ fontWeight: '800', color: side === 'Blue' ? '#60a5fa' : '#f87171', fontSize: '14px' }}>
              {`${side.toUpperCase()} TEAM`}
            </span>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', tableLayout: 'fixed' }}>
            <thead style={{ backgroundColor: '#111827', color: '#9ca3af' }}>
              <tr>
                <th style={{ padding: '12px', textAlign: 'left', width: '54%' }}>플레이어</th>
                <th style={{ padding: '12px', width: '10%' }}>KDA</th>
                <th style={{ padding: '12px', width: '16%' }}>시야/제어</th>
                <th style={{ padding: '12px', width: '10%' }}>딜량</th>
                <th style={{ padding: '12px', textAlign: 'center', width: '12%', paddingRight: '18px' }}>CS</th>
              </tr>
            </thead>
            <tbody>
              {playerStats.filter(p => p.side === side).map((p, i) => (
                <tr key={i} onClick={() => handlePlayerClick(p.nickname)} style={{ borderBottom: '1px solid #374151', cursor: 'pointer' }}>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img src={getChampImgUrl(p.champion)} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%', border: `2px solid ${side === 'Blue' ? '#3b82f6' : '#ef4444'}`, flexShrink: 0 }} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1 }}>
                        <span style={{ fontWeight: 'bold', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '85px' }}>
                          {p.nickname}
                        </span>
                        <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                          {(p.firstBlood === true || p.firstBlood === 'true') && <Badge label="퍼블" color="#f59e0b" />}
                          {getMultiKillLabel(p.multiKill) && <Badge label={getMultiKillLabel(p.multiKill)} color="#ef4444" />}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ textAlign: 'center', color: '#d1d5db' }}>{p.kills}/{p.deaths}/{p.assists}</td>
                  <td style={{ textAlign: 'center', color: '#60a5fa' }}>{p.vision_score}/{p.control_wards}</td>
                  <td style={{ textAlign: 'center', color: '#fca5a5' }}>{p.damage.toLocaleString()}</td>
                  <td style={{ textAlign: 'center', color: '#9ca3af', paddingRight: '8px' }}>{p.cs}</td>
                </tr>
              ))}
            </tbody>
            
            {/* 밴 목록 Row: JSON 객체 구조 반영 */}
            <tfoot style={{ backgroundColor: '#111827', borderTop: '2px solid #374151' }}>
              <tr>
                <td colSpan="5" style={{ padding: '10px 15px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: side === 'Blue' ? '#3b82f6' : '#ef4444', letterSpacing: '1px' }}>BANS</span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {bans.map((ban, idx) => (
                        <div key={idx} style={{ width: '26px', height: '26px', borderRadius: '4px', overflow: 'hidden', border: '1px solid #374151' }}>
                          <img 
                            src={getChampImgUrl(ban.champ)} // 객체 내부의 champ 필드 사용
                            alt="ban" 
                            style={{ width: '100%', height: '100%', filter: 'grayscale(100%) opacity(0.6)' }} 
                          />
                        </div>
                      ))}
                      {/* 데이터가 비어있을 경우 빈 칸 유지 */}
                      {bans.length === 0 && [1,2,3,4,5].map(n => (
                        <div key={n} style={{ width: '26px', height: '26px', borderRadius: '4px', backgroundColor: '#0a0e17', border: '1px solid #1f2937' }} />
                      ))}
                    </div>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      );
    })}
  </section>
)}

        {/* ... (이하 경기 그래프 및 분석 리포트 부분 유지) */}
        <section style={{ backgroundColor: '#1f2937', padding: '35px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffffff' }}>경기 그래프</h2>
            <div style={{ backgroundColor: '#111827', padding: '5px', borderRadius: '10px', display: 'flex', gap: '5px' }}>
              {[{ id: 'damage', label: '데미지', color: '#e97171' }, { id: 'gold', label: '골드', color: '#fbbf24' }, { id: 'vision_score', label: '시야', color: '#60a5fa' }, { id: 'damage_taken', label: '받은 데미지', color: '#10b981' }, { id: 'cs', label: 'CS', color: '#a78bfa' }].map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', backgroundColor: activeTab === t.id ? t.color : 'transparent', color: activeTab === t.id ? (t.id === 'gold' ? '#000' : '#fff') : '#9ca3af', fontSize: '13px' }}>{t.label}</button>
              ))}
            </div>
          </div>
          <ResponsiveContainer height={350}>
            <BarChart data={playerStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
              <XAxis dataKey="nickname" stroke="#9ca3af" height={60} dy={10} tick={{ fontSize: 13 }} />
              <YAxis stroke="#9ca3af" tick={{ fontSize: 13 }} />
              <ReTooltip content={<CustomTooltip />} />
              <Bar dataKey={activeTab} fill={activeTab === 'damage' ? '#e97171' : activeTab === 'gold' ? '#fbbf24' : activeTab === 'vision_score' ? '#60a5fa' : activeTab === 'damage_taken' ? '#10b981' : '#a78bfa'} radius={[6, 6, 0, 0]} barSize={30} onClick={(d) => handlePlayerClick(d.nickname)}>
                <LabelList dataKey={activeTab} position="top" fill="#9ca3af" fontSize={10} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </section>

        {/* ... (이하 경기 그래프 섹션까지 동일) */}

{selectedPlayer && currentData && (
  <section style={{ backgroundColor: '#1f2937', padding: '35px', borderRadius: '16px', border: '2px solid #3b82f6' }}>
    {/* 헤더 부분 */}
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: '#60a5fa', margin: 0 }}>👤 {selectedPlayer.nickname} 분석 리포트</h2>
        <div style={{ backgroundColor: '#111827', padding: '4px', borderRadius: '10px', display: 'flex', gap: '4px', border: '1px solid #374151' }}>
          <button onClick={() => setDataScope('ALL')} style={{ padding: '6px 14px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', backgroundColor: dataScope === 'ALL' ? '#3b82f6' : 'transparent', color: dataScope === 'ALL' ? '#fff' : '#9ca3af', transition: '0.2s' }}>전체</button>
          <button onClick={() => setDataScope('RECENT')} style={{ padding: '6px 14px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', backgroundColor: dataScope === 'RECENT' ? '#3b82f6' : 'transparent', color: dataScope === 'RECENT' ? '#fff' : '#9ca3af', transition: '0.2s' }}>최근 10경기</button>
        </div>
      </div>
      <button onClick={() => setSelectedPlayer(null)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '20px' }}>✕</button>
    </div>
    
    {/* 라인 탭 부분 */}
    <div style={{ display: 'flex', gap: '10px', marginBottom: '25px' }}>
      <LineTab 
    label="전체" 
    active={selectedLine === 'ALL'} 
    count={selectedPlayer.fullHistory.length} 
    winRate={Math.round((selectedPlayer.fullHistory.filter(h => h.isWin).length / selectedPlayer.fullHistory.length) * 100)}
    onClick={() => { setSelectedLine('ALL'); setSelectedChampion(null); }} 
  />

  {/* 라인별 탭: 데이터를 명확히 전달하도록 수정 */}
  {['TOP', 'JNG', 'MID', 'ADC', 'SUP'].map(lane => {
    const summary = selectedPlayer.lineSummary[lane];
    // 해당 라인 데이터가 없으면 탭을 생성하지 않음
    if (!summary) return null;

    return (
      <LineTab 
        key={lane} 
        label={lane} 
        active={selectedLine === lane} 
        count={summary.count} // ✅ 누락되었던 숫자 전달
        winRate={Math.round((summary.wins / summary.count) * 100)} // ✅ 승률 전달
        onClick={() => { setSelectedLine(lane); setSelectedChampion(null); }} 
      />
    );
  })}
</div>

    {/* 1. 통계 아이템 그리드 */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '25px' }}>
      <StatItem label="승률" value={`${currentData.winRate}%`} color="#3b82f6" />
      <StatItem label="KDA" value={currentData.kda} color="#10b981" rank={getRankingsByLine(selectedPlayer.nickname, 'avgKda', selectedLine)} />
      <StatItem label="킬 관여율(KP)" value={`${currentData.avgKp}%`} color="#f472b6" rank={getRankingsByLine(selectedPlayer.nickname, 'avgKp', selectedLine)} />
      <StatItem label="데미지 비중" value={`${currentData.avgDmgShare}%`} color="#e97171" rank={getRankingsByLine(selectedPlayer.nickname, 'avgDmgShare', selectedLine)} />
      <StatItem label="퍼블율" value={`${currentData.fbRate}%`} color="#fbbf24" rank={getRankingsByLine(selectedPlayer.nickname, 'fbRate', selectedLine)} />
      <StatItem label="분당 딜량" value={currentData.avgDpm} color="#8b5cf6" rank={getRankingsByLine(selectedPlayer.nickname, 'avgDpm', selectedLine)} />
      <StatItem label="분당 받은 딜량" value={currentData.avgDtpm} color="#10b981" rank={getRankingsByLine(selectedPlayer.nickname, 'avgDtpm', selectedLine)} />
      <StatItem label="분당 골드" value={currentData.avgGpm} color="#fbbf24" rank={getRankingsByLine(selectedPlayer.nickname, 'avgGpm', selectedLine)} />
      <StatItem label="골드당 데미지" value={currentData.avgDpg} color="#ec4899" rank={getRankingsByLine(selectedPlayer.nickname, 'avgDpg', selectedLine)} />
      <StatItem label="분당 CS" value={currentData.avgCspm} color="#10b981" rank={getRankingsByLine(selectedPlayer.nickname, 'avgCspm', selectedLine)} />
      <StatItem label="시야 점수" value={currentData.avgVs} color="#60a5fa" rank={getRankingsByLine(selectedPlayer.nickname, 'avgVs', selectedLine)} />
      <StatItem label="제어 와드" value={`${currentData.avgControlWards}개`} color="#60a5fa" rank={getRankingsByLine(selectedPlayer.nickname, 'avgControlWards', selectedLine)} />
    </div>

    {/* ⭐ 2. 모스트 픽 & 밴 섹션 (이 부분을 정확히 확인하세요) */}
<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '25px' }}>
      
      {/* MOST PICKED 집계 */}
      <div style={{ backgroundColor: '#111827', padding: '5px', paddingBottom: '20px', borderRadius: '16px', border: '1px solid #374151' }}>
        <h3 style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '20px' }}>🔝 MOST PICKED</h3>
        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          {(() => {
            const counts = {};
            // currentData.history가 비었을 경우를 대비해 fullHistory까지 백업으로 사용
            const sourceList = (currentData?.history && currentData.history.length > 0) ? currentData.history : (selectedPlayer?.fullHistory || []);
            
            sourceList.forEach(h => {
              // 🔍 어떤 이름으로 저장되어 있든 다 찾아냅니다!
              const name = h.champion || h.champ || h.champion_name || h.championName || h.name || h.champName;
              if (name && name !== "undefined") {
                counts[name] = (counts[name] || 0) + 1;
              }
            });

            const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3);

            return sorted.length > 0 ? sorted.map(([name, count], i) => (
              <div 
        key={name} 
        // ✅ [추가] 클릭 시 해당 챔피언 선택/해제 토글
        onClick={() => setSelectedChampion(selectedChampion === name ? null : name)}
        style={{ 
          textAlign: 'center', 
          cursor: 'pointer',
          // ✅ [추가] 선택되지 않은 다른 챔피언은 흐리게 표시
          opacity: selectedChampion && selectedChampion !== name ? 0.4 : 1,
          transform: selectedChampion === name ? 'scale(1.1)' : 'scale(1)',
          transition: '0.2s'
        }}
      >
        <img 
          src={getChampImgUrl(name)} 
          style={{ 
            width: '45px', height: '45px', borderRadius: '10px', 
            // ✅ [추가] 선택 시 노란색 테두리 효과
            border: selectedChampion === name ? '2px solid #fbbf24' : '1px solid #374151',
            boxShadow: selectedChampion === name ? '0 0 10px rgba(251, 191, 36, 0.5)' : 'none'
          }} 
          alt={name} 
        />
        <p style={{ fontSize: '11px', color: '#fff', marginTop: '6px', fontWeight: 'bold' }}>
          {name}
        </p>
        <p style={{ fontSize: '10px', color: '#9ca3af' }}>{count}회</p>
      </div>
    )) : <p>...</p>;
  })()}
</div>
      </div>

      {/* MOST BANNED 집계 */}
      <div style={{ backgroundColor: '#111827', padding: '5px', paddingBottom: '20px', borderRadius: '16px', border: '1px solid #374151' }}>
        <h3 style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '20px' }}>🚫 MOST BANNED </h3>
        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          {(() => {
            const banCounts = {};
            const matchesArr = (typeof matches !== 'undefined') ? matches : [];
            const history = selectedPlayer?.fullHistory || [];

            history.forEach(h => {
  const mId = h.match_id || h.matchId || h.id;
  const match = matchesArr.find(m => String(m.id) === String(mId));
  
  if (match) {
    // 플레이어의 현재 판 진영 확인
    const myCurrentSide = h.isWin ? match.win_team : (match.win_team === 'Blue' ? 'Red' : 'Blue');
    // 상대방 진영의 밴 목록만 가져오기
    const opponentBans = myCurrentSide === 'Blue' ? (match.red_bans || []) : (match.blue_bans || []);

    opponentBans.forEach(b => {
      if (!b.target || !b.champ) return;
      const bTarget = String(b.target).toUpperCase().trim();
      const pLane = String(h.lane || "").toUpperCase().trim();
      
      if (bTarget === pLane) {
        banCounts[b.champ] = (banCounts[b.champ] || 0) + 1;
      }
    });
  }
});

            const sortedBans = Object.entries(banCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);

            return sortedBans.length > 0 ? sortedBans.map(([name, count]) => (
              <div key={name} style={{ textAlign: 'center' }}>
                <img src={getChampImgUrl(name)} style={{ width: '45px', height: '45px', borderRadius: '10px', border: '1px solid #ef4444', filter: 'grayscale(0.8)' }} alt={name} />
                <p style={{ fontSize: '11px', color: '#fff', marginTop: '6px', fontWeight: 'bold' }}>{name}</p>
                <p style={{ fontSize: '10px', color: '#ef4444' }}>{count}회 밴</p>
              </div>
            )) : <p style={{ color: '#4b5563', fontSize: '12px', textAlign: 'center', width: '100%' }}>저격 밴 없음</p>;
          })()}
        </div>
      </div>
    </div>

    {/* 3. 추이 그래프 및 레이더 차트 */}
    <div style={{ display: 'grid', gridTemplateColumns: selectedLine === 'ALL' ? '1fr' : '1.2fr 0.8fr', gap: '20px' }}>
      <div style={{ backgroundColor: '#111827', padding: '25px', borderRadius: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '14px', color: '#9ca3af' }}>📊 {selectedLine} {reportType.toUpperCase()} 추이</h3>
          <div style={{ backgroundColor: '#1f2937', padding: '4px', borderRadius: '8px', display: 'flex', gap: '4px' }}>
            {['dpm', 'dtpm', 'gpm', 'cspm', 'vs', 'dpg'].map(type => (
              <button key={type} onClick={() => setReportType(type)} style={{ padding: '6px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '10px', backgroundColor: reportType === type ? '#3b82f6' : 'transparent', color: '#fff' }}>{type.toUpperCase()}</button>
            ))}
          </div>
        </div>
        <ResponsiveContainer height={250}>
          <LineChart data={currentData.history}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
            <XAxis dataKey="date" stroke="#9ca3af" tick={{ fontSize: 10 }} />
            <YAxis stroke="#9ca3af" tick={{ fontSize: 13 }}/>
            <ReTooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey={reportType} stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {selectedLine !== 'ALL' && (
        <div style={{ backgroundColor: '#111827', padding: '25px', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h3 style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '15px' }}>💠 {selectedLine} 평균 대비 성향</h3>
          <ResponsiveContainer width="100%" height={230}>
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
              <PolarGrid stroke="#374151" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 10 }} />
              <Tooltip content={<RadarCustomTooltip />} /> 
              <Radar name="내 지표" dataKey="player" stroke="#f97316" fill="#f97316" fillOpacity={0.5} />
              <Radar name="라인 평균" dataKey="average" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.2} />
            </RadarChart>
          </ResponsiveContainer>
          <p style={{ fontSize: '10px', color: '#4b5563', marginTop: '10px' }}>* 그래프 지표에 마우스를 올리면 상세 비교가 가능합니다.</p>
        </div>
      )}
    </div>
  </section>
)}
      </div>
    </div>
  );
}

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
        <div style={{ 
          position: 'absolute', top: '5px', left: '5px', 
          backgroundColor: rank.rank === 1 ? '#fbbf24' : rank.rank === 2 ? '#94a3b8' : '#92400e', 
          color: rank.rank === 1 ? '#000' : '#fff', fontSize: '8px', padding: '2px 5px', borderRadius: '4px', fontWeight: 'bold' 
        }}>
          {rank.line === 'ALL' ? `ALL ${getOrdinal(rank.rank)}` : `${rank.line} ${getOrdinal(rank.rank)}`}
        </div>
      )}
      <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '6px' }}>{label}</p>
      <p style={{ fontSize: '17px', fontWeight: 'bold', color }}>{value}</p>
    </div>
  );
};

export default App;