import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  LabelList, LineChart, Line,
  Radar, RadarChart, PolarGrid, PolarAngleAxis
} from 'recharts';
import './App.css';

/* =====================================================
   반응형 훅
   ===================================================== */
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

const laneOrder = {
  'TOP': 1, 'JNG': 2, 'JUNGLE': 2, 'MID': 3, 'ADC': 4, 'BOT': 4, 'SUP': 5, 'SUPPORT': 5
};

const getChampImgUrl = (enId) => {
  if (!enId) return 'https://ddragon.leagueoflegends.com/cdn/13.24.1/img/champion/tiles/Empty_0.jpg';
  const formattedId = enId.charAt(0).toUpperCase() + enId.slice(1);
  return `https://ddragon.leagueoflegends.com/cdn/img/champion/tiles/${formattedId}_0.jpg`;
};

const ALL_CHAMPIONS = [
  { ko: "가렌", en: "Garen" }, { ko: "갈리오", en: "Galio" }, { ko: "갱플랭크", en: "Gangplank" }, { ko: "그라가스", en: "Gragas" }, { ko: "그레이브즈", en: "Graves" }, { ko: "그웬", en: "Gwen" }, { ko: "나르", en: "Gnar" }, { ko: "나미", en: "Nami" }, { ko: "나서스", en: "Nasus" }, { ko: "나피리", en: "Naafiri" }, { ko: "노틸러스", en: "Nautilus" }, { ko: "녹턴", en: "Nocturne" }, { ko: "누누와 윌럼프", en: "Nunu" }, { ko: "니달리", en: "Nidalee" }, { ko: "니코", en: "Neeko" }, { ko: "닐라", en: "Nilah" }, { ko: "다리우스", en: "Darius" }, { ko: "다이애나", en: "Diana" }, { ko: "드레이븐", en: "Draven" }, { ko: "라이즈", en: "Ryze" }, { ko: "라칸", en: "Rakan" }, { ko: "람머스", en: "Armordillo" }, { ko: "럭스", en: "Lux" }, { ko: "럼블", en: "Rumble" }, { ko: "레나타 글라스크", en: "Renata" }, { ko: "레넥톤", en: "Renekton" }, { ko: "레오나", en: "Leona" }, { ko: "렉사이", en: "RekSai" }, { ko: "렐", en: "Rell" }, { ko: "렝가", en: "Rengar" }, { ko: "루시안", en: "Lucian" }, { ko: "룰루", en: "Lulu" }, { ko: "르블랑", en: "Leblanc" }, { ko: "리 신", en: "LeeSin" }, { ko: "리븐", en: "Riven" }, { ko: "리산드라", en: "Lissandra" }, { ko: "릴리아", en: "Lillia" }, { ko: "마스터 이", en: "MasterYi" }, { ko: "마오카이", en: "Maokai" }, { ko: "말자하", en: "Malzahar" }, { ko: "말파이트", en: "Malphite" }, { ko: "멜", en: "Mel" }, { ko: "모데카이저", en: "Mordekaiser" }, { ko: "모르가나", en: "Morgana" }, { ko: "밀리오", en: "Milio" }, { ko: "바루스", en: "Varus" }, { ko: "바드", en: "Bard" }, { ko: "바이", en: "Vi" }, { ko: "벡스", en: "Vex" }, { ko: "베인", en: "Vayne" }, { ko: "베이가", en: "Veigar" }, { ko: "벨베스", en: "Belveth" }, { ko: "벨코즈", en: "Velkoz" }, { ko: "볼리베어", en: "Volibear" }, { ko: "브라움", en: "Braum" }, { ko: "브라이어", en: "Briar" }, { ko: "브랜드", en: "Brand" }, { ko: "블라디미르", en: "Vladimir" }, { ko: "블리츠크랭크", en: "Blitzcrank" }, { ko: "비에고", en: "Viego" }, { ko: "빅토르", en: "Viktor" }, { ko: "뽀삐", en: "Poppy" }, { ko: "사미라", en: "Samira" }, { ko: "사이온", en: "Sion" }, { ko: "사일러스", en: "Sylas" }, { ko: "샤코", en: "Shaco" }, { ko: "세나", en: "Senna" }, { ko: "세라핀", en: "Seraphine" }, { ko: "세주아니", en: "Sejuani" }, { ko: "세트", en: "Sett" }, { ko: "소나", en: "Sona" }, { ko: "소라카", en: "Soraka" }, { ko: "쉔", en: "Shen" }, { ko: "쉬바나", en: "Shyvana" }, { ko: "스웨인", en: "Swain" }, { ko: "스카너", en: "Skarner" }, { ko: "스몰더", en: "Smolder" }, { ko: "시비르", en: "Sivir" }, { ko: "신 짜오", en: "XinZhao" }, { ko: "신드라", en: "Syndra" }, { ko: "신지드", en: "Singed" }, { ko: "쓰레쉬", en: "Thresh" }, { ko: "아리", en: "Ahri" }, { ko: "아무무", en: "Amumu" }, { ko: "아우렐리온 솔", en: "AurelionSol" }, { ko: "아이번", en: "Ivern" }, { ko: "아지르", en: "Azir" }, { ko: "아칼리", en: "Akali" }, { ko: "아크샨", en: "Akshan" }, { ko: "아트록스", en: "Aatrox" }, { ko: "아펠리오스", en: "Aphelios" }, { ko: "알리스타", en: "Alistar" }, { ko: "암베사", en: "Ambessa" }, { ko: "애니", en: "Annie" }, { ko: "애니비아", en: "Anivia" }, { ko: "애쉬", en: "Ashe" }, { ko: "야스오", en: "Yasuo" }, { ko: "에코", en: "Ekko" }, { ko: "엘리스", en: "Elise" }, { ko: "오공", en: "MonkeyKing" }, { ko: "오로라", en: "Aurora" }, { ko: "오른", en: "Ornn" }, { ko: "오리아나", en: "Orianna" }, { ko: "올라프", en: "Olaf" }, { ko: "요네", en: "Yone" }, { ko: "요릭", en: "Yorick" }, { ko: "우디르", en: "Udyr" }, { ko: "우르곳", en: "Urgot" }, { ko: "워윅", en: "Warwick" }, { ko: "유나라", en: "Yunara" }, { ko: "유미", en: "Yuumi" }, { ko: "이렐리아", en: "Irelia" }, { ko: "이블린", en: "Evelynn" }, { ko: "이즈리얼", en: "Ezreal" }, { ko: "일라오이", en: "Illaoi" }, { ko: "자르반 4세", en: "JarvanIV" }, { ko: "자야", en: "Xayah" }, { ko: "자이라", en: "Zyra" }, { ko: "자크", en: "Zac" }, { ko: "자헨", en: "Zaahen" }, { ko: "잔나", en: "Janna" }, { ko: "잭스", en: "Jax" }, { ko: "제드", en: "Zed" }, { ko: "제라스", en: "Xerath" }, { ko: "제리", en: "Zeri" }, { ko: "제이스", en: "Jayce" }, { ko: "조이", en: "Zoe" }, { ko: "직스", en: "Ziggs" }, { ko: "진", en: "Jhin" }, { ko: "질리언", en: "Zilean" }, { ko: "징크스", en: "Jinx" }, { ko: "초가스", en: "Chogath" }, { ko: "카르마", en: "Karma" }, { ko: "카밀", en: "Camille" }, { ko: "카사딘", en: "Kassadin" }, { ko: "카서스", en: "Karthus" }, { ko: "카시오페아", en: "Cassiopeia" }, { ko: "카이사", en: "Kaisa" }, { ko: "카직스", en: "Khazix" }, { ko: "카타리나", en: "Katarina" }, { ko: "칼리스타", en: "Kalista" }, { ko: "케넨", en: "Kennen" }, { ko: "케이틀린", en: "Caitlyn" }, { ko: "케인", en: "Kayn" }, { ko: "케일", en: "Kayle" }, { ko: "코그모", en: "KogMaw" }, { ko: "코르키", en: "Corki" }, { ko: "퀸", en: "Quinn" }, { ko: "크산테", en: "Ksante" }, { ko: "클레드", en: "Kled" }, { ko: "키아나", en: "Qiyana" }, { ko: "킨드레드", en: "Kindred" }, { ko: "타릭", en: "Taric" }, { ko: "탈론", en: "Talon" }, { ko: "탈리야", en: "Taliyah" }, { ko: "탐 켄치", en: "TahmKench" }, { ko: "트런들", en: "Trundle" }, { ko: "트리스타나", en: "Tristana" }, { ko: "트린다미어", en: "Tryndamere" }, { ko: "트위스티드 페이트", en: "TwistedFate" }, { ko: "트위치", en: "Twitch" }, { ko: "티모", en: "Teemo" }, { ko: "파이크", en: "Pyke" }, { ko: "판테온", en: "Pantheon" }, { ko: "피들스틱", en: "Fiddlesticks" }, { ko: "피오라", en: "Fiora" }, { ko: "피즈", en: "Fizz" }, { ko: "하이머딩거", en: "Heimerdinger" }, { ko: "헤카림", en: "Hecarim" }, { ko: "흐웨이", en: "Hwei" }
];

const enToKoMap = {};
ALL_CHAMPIONS.forEach(c => { enToKoMap[c.en.toLowerCase()] = c.ko; });
const getChampKoName = (enName) => {
  if (!enName) return '';
  return enToKoMap[enName.toLowerCase()] || enName;
};

/* --- 커스텀 툴팁 --- */
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        backgroundColor: 'rgba(17, 24, 39, 0.9)', backdropFilter: 'blur(8px)',
        border: '1px solid #3b82f6', borderRadius: '12px', padding: '12px 16px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)', color: '#f3f4f6'
      }}>
        <p style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 'bold', color: '#9ca3af' }}>{label || '데이터'}</p>
        {payload.map((entry, index) => (
          <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: entry.color || entry.fill }} />
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
          <div style={{ marginTop: '4px', paddingTop: '4px', borderTop: '1px solid #374151', color: isHigher ? '#60a5fa' : '#ef4444', fontWeight: 'bold', textAlign: 'center' }}>
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

/* =====================================================
   챔피언 분석 탭
   ===================================================== */
function ChampionAnalysis({ allStats, matches }) {
  const isMobile = useIsMobile();
  const [sortKey, setSortKey] = useState('pickCount');
  const [sortDir, setSortDir] = useState('desc');
  const [laneFilter, setLaneFilter] = useState('ALL');
  const [hoveredChamp, setHoveredChamp] = useState(null);

  const champStats = (() => {
    const map = {};
    const totalGames = matches.length;

    const laneGameCount = laneFilter === 'ALL'
      ? totalGames
      : new Set(
          allStats.filter(s => String(s.lane || '').toUpperCase().trim() === laneFilter).map(s => s.match_id)
        ).size;

    allStats.forEach(s => {
      const name = s.champion;
      if (!name || name === 'undefined') return;
      const lane = String(s.lane || 'MID').toUpperCase().trim();
      if (laneFilter !== 'ALL' && lane !== laneFilter) return;
      if (!map[name]) {
        map[name] = { name, pickCount: 0, wins: 0, totalDmg: 0, totalDmgTaken: 0, totalGold: 0, totalCs: 0, totalVs: 0, totalControlWards: 0, totalK: 0, totalD: 0, totalA: 0, totalMin: 0, lanes: {} };
      }
      const [min, sec] = (s.matches?.duration || '20:00').split(':').map(Number);
      const m = (min || 20) + (sec / 60 || 0);
      const mySide = String(s.side || '').trim().toLowerCase();
      const winSide = String(s.matches?.win_team || '').trim().toLowerCase();
      const isWin = mySide !== '' && winSide !== '' && mySide === winSide;
      map[name].pickCount += 1;
      if (isWin) map[name].wins += 1;
      map[name].totalDmg += Number(s.damage || 0);
      map[name].totalDmgTaken += Number(s.damage_taken || 0);
      map[name].totalGold += Number(s.gold || 0);
      map[name].totalCs += Number(s.cs || 0);
      map[name].totalVs += Number(s.vision_score || 0);
      map[name].totalControlWards += Number(s.control_wards || 0);
      map[name].totalK += Number(s.kills || 0);
      map[name].totalD += Number(s.deaths || 0);
      map[name].totalA += Number(s.assists || 0);
      map[name].totalMin += m;
      map[name].lanes[lane] = (map[name].lanes[lane] || 0) + 1;
    });

    return Object.values(map).map(c => {
      const safeM = c.totalMin > 0 ? c.totalMin : 1;
      const safeCount = c.pickCount > 0 ? c.pickCount : 1;
      const totalKA = c.totalK + c.totalA;
      const pickRate = laneGameCount > 0 ? ((c.pickCount / laneGameCount) * 100).toFixed(1) : '0.0';
      const banRate = (() => {
        if (laneGameCount === 0) return '0.0';
        let banCount = 0;
        matches.forEach(m => {
          const allBans = [...(m.blue_bans || []), ...(m.red_bans || [])];
          if (allBans.some(b => {
            if (b.champ !== c.name) return false;
            if (laneFilter === 'ALL') return true;
            return String(b.target || '').toUpperCase().trim() === laneFilter;
          })) banCount++;
        });
        return (((banCount + c.pickCount) / laneGameCount) * 100).toFixed(1);
      })();
      return {
        ...c,
        winRate: Math.round((c.wins / c.pickCount) * 100),
        pickRate, banRate,
        kda: c.totalD === 0 ? (totalKA > 0 ? 'Perfect' : '0.00') : (totalKA / c.totalD).toFixed(2),
        kdaNum: c.totalD === 0 ? 9999 : totalKA / c.totalD,
        dpm: Math.round(c.totalDmg / safeM), dtpm: Math.round(c.totalDmgTaken / safeM),
        gpm: Math.round(c.totalGold / safeM), cspm: (c.totalCs / safeM).toFixed(2),
        avgControlWards: (c.totalControlWards / safeCount).toFixed(1),
        dpg: c.totalGold > 0 ? (c.totalDmg / c.totalGold).toFixed(2) : '0.00',
        avgKills: (c.totalK / safeCount).toFixed(1), avgDeaths: (c.totalD / safeCount).toFixed(1),
        avgAssists: (c.totalA / safeCount).toFixed(1),
        mostLane: Object.entries(c.lanes).sort((a, b) => b[1] - a[1])[0]?.[0] || '-'
      };
    });
  })();

  const sorted = [...champStats].sort((a, b) => {
    const aVal = sortKey === 'kda' ? a.kdaNum : (parseFloat(a[sortKey]) || 0);
    const bVal = sortKey === 'kda' ? b.kdaNum : (parseFloat(b[sortKey]) || 0);
    return sortDir === 'desc' ? bVal - aVal : aVal - bVal;
  });

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const SortTh = ({ label, k, width }) => (
    <th onClick={() => handleSort(k)} style={{ padding: '12px 10px', cursor: 'pointer', userSelect: 'none', width, color: sortKey === k ? '#60a5fa' : '#9ca3af', fontSize: '12px', fontWeight: 'bold', borderBottom: '2px solid #374151', textAlign: 'center', background: sortKey === k ? 'rgba(59,130,246,0.08)' : 'transparent', transition: '0.15s' }}>
      {label} {sortKey === k ? (sortDir === 'desc' ? '▼' : '▲') : ''}
    </th>
  );

  const lanes = ['ALL', 'TOP', 'JNG', 'MID', 'ADC', 'SUP'];

  /* 모바일: 카드 리스트 */
  if (isMobile) {
    return (
      <div>
        {/* 라인 필터 */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
          {lanes.map(lane => (
            <button key={lane} onClick={() => setLaneFilter(lane)} style={{ padding: '6px 14px', borderRadius: '8px', border: laneFilter === lane ? '1px solid #60a5fa' : '1px solid #374151', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', flexShrink: 0, backgroundColor: laneFilter === lane ? '#3b82f6' : '#111827', color: laneFilter === lane ? '#fff' : '#9ca3af' }}>{lane}</button>
          ))}
        </div>
        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px' }}>총 {sorted.length}개 챔피언 · 탭하여 정렬</div>
        {/* 정렬 버튼 */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
          {[['pickCount','픽수'],['winRate','승률'],['kda','KDA'],['dpm','DPM'],['gpm','GPM'],['banRate','밴픽률']].map(([k, label]) => (
            <button key={k} onClick={() => handleSort(k)} style={{ padding: '5px 12px', borderRadius: '6px', border: sortKey === k ? '1px solid #60a5fa' : '1px solid #374151', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', flexShrink: 0, backgroundColor: sortKey === k ? '#1e3a5f' : '#111827', color: sortKey === k ? '#60a5fa' : '#6b7280' }}>
              {label} {sortKey === k ? (sortDir === 'desc' ? '▼' : '▲') : ''}
            </button>
          ))}
        </div>
        {/* 카드 리스트 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {sorted.map((c, i) => {
            const winColor = c.winRate >= 60 ? '#34d399' : c.winRate >= 50 ? '#60a5fa' : c.winRate >= 40 ? '#fbbf24' : '#f87171';
            return (
              <div key={c.name} style={{ backgroundColor: '#111827', borderRadius: '12px', padding: '14px', border: `1px solid #374151` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <img src={getChampImgUrl(c.name)} alt={c.name} style={{ width: '44px', height: '44px', borderRadius: '10px', border: `2px solid ${winColor}` }} />
                    <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', backgroundColor: '#0a0e17', border: '1px solid #374151', borderRadius: '4px', fontSize: '9px', color: '#9ca3af', padding: '1px 3px', fontWeight: 'bold' }}>{c.mostLane}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '15px' }}>{getChampKoName(c.name)}</div>
                    <div style={{ fontSize: '11px', color: '#6b7280' }}>{c.pickCount}경기</div>
                  </div>
                  <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: '8px', backgroundColor: `${winColor}22`, color: winColor, fontWeight: 'bold', fontSize: '15px' }}>{c.winRate}%</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {[
                    { label: '픽률', value: `${c.pickRate}%`, color: '#a78bfa' },
                    { label: '밴픽률', value: `${c.banRate}%`, color: '#c084fc' },
                    { label: 'KDA', value: c.kda, color: c.kda === 'Perfect' ? '#fbbf24' : '#10b981' },
                    { label: 'DPM', value: c.dpm.toLocaleString(), color: '#fca5a5' },
                    { label: 'GPM', value: c.gpm.toLocaleString(), color: '#fbbf24' },
                    { label: 'CSPM', value: c.cspm, color: '#a78bfa' },
                  ].map(item => (
                    <div key={item.label} style={{ backgroundColor: '#1f2937', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '3px' }}>{item.label}</div>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', color: item.color }}>{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {sorted.length === 0 && <div style={{ textAlign: 'center', padding: '40px', color: '#4b5563' }}>데이터가 없습니다</div>}
        </div>
      </div>
    );
  }

  /* PC: 기존 테이블 */
  return (
    <div>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
        {lanes.map(lane => (
          <button key={lane} onClick={() => setLaneFilter(lane)} style={{ padding: '8px 18px', borderRadius: '10px', border: laneFilter === lane ? '1px solid #60a5fa' : '1px solid #374151', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', transition: '0.2s', backgroundColor: laneFilter === lane ? '#3b82f6' : '#111827', color: laneFilter === lane ? '#fff' : '#9ca3af' }}>{lane}</button>
        ))}
        <span style={{ marginLeft: 'auto', color: '#6b7280', fontSize: '13px', alignSelf: 'center' }}>총 {sorted.length}개 챔피언</span>
      </div>
      <div style={{ overflowX: 'auto', borderRadius: '16px', border: '1px solid #374151' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead style={{ backgroundColor: '#111827', position: 'sticky', top: 0, zIndex: 1 }}>
            <tr>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#9ca3af', fontSize: '12px', fontWeight: 'bold', borderBottom: '2px solid #374151', width: '180px' }}>챔피언</th>
              <SortTh label="픽 수" k="pickCount" width="70px" />
              <SortTh label="픽률%" k="pickRate" width="70px" />
              <SortTh label="밴픽률%" k="banRate" width="75px" />
              <SortTh label="승률%" k="winRate" width="70px" />
              <SortTh label="KDA" k="kda" width="80px" />
              <SortTh label="평균 K" k="avgKills" width="65px" />
              <SortTh label="평균 D" k="avgDeaths" width="65px" />
              <SortTh label="평균 A" k="avgAssists" width="65px" />
              <SortTh label="DPM" k="dpm" width="80px" />
              <SortTh label="DTPM" k="dtpm" width="80px" />
              <SortTh label="GPM" k="gpm" width="80px" />
              <SortTh label="CSPM" k="cspm" width="75px" />
              <SortTh label="제어와드" k="avgControlWards" width="75px" />
              <SortTh label="딜/골드" k="dpg" width="75px" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((c, i) => {
              const winColor = c.winRate >= 60 ? '#34d399' : c.winRate >= 50 ? '#60a5fa' : c.winRate >= 40 ? '#fbbf24' : '#f87171';
              const isHovered = hoveredChamp === c.name;
              return (
                <tr key={c.name} onMouseEnter={() => setHoveredChamp(c.name)} onMouseLeave={() => setHoveredChamp(null)} style={{ borderBottom: '1px solid #1f2937', backgroundColor: isHovered ? 'rgba(59,130,246,0.07)' : i % 2 === 0 ? '#1a2030' : '#1f2937', transition: '0.15s' }}>
                  <td style={{ padding: '10px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ position: 'relative' }}>
                        <img src={getChampImgUrl(c.name)} alt={c.name} style={{ width: '36px', height: '36px', borderRadius: '8px', border: `2px solid ${winColor}`, flexShrink: 0 }} />
                        <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '4px', fontSize: '9px', color: '#9ca3af', padding: '1px 3px', fontWeight: 'bold' }}>{c.mostLane}</div>
                      </div>
                      <div>
                        <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '13px' }}>{getChampKoName(c.name)}</div>
                        <div style={{ fontSize: '10px', color: '#6b7280' }}>{c.pickCount}경기</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ textAlign: 'center', color: '#d1d5db', fontWeight: 'bold' }}>{c.pickCount}</td>
                  <td style={{ textAlign: 'center', color: '#a78bfa' }}>{c.pickRate}%</td>
                  <td style={{ textAlign: 'center', color: '#c084fc' }}>{c.banRate}%</td>
                  <td style={{ textAlign: 'center' }}><span style={{ display: 'inline-block', padding: '3px 8px', borderRadius: '6px', backgroundColor: `${winColor}22`, color: winColor, fontWeight: 'bold', fontSize: '13px' }}>{c.winRate}%</span></td>
                  <td style={{ textAlign: 'center', color: c.kda === 'Perfect' ? '#fbbf24' : '#10b981', fontWeight: 'bold' }}>{c.kda}</td>
                  <td style={{ textAlign: 'center', color: '#60a5fa' }}>{c.avgKills}</td>
                  <td style={{ textAlign: 'center', color: '#f87171' }}>{c.avgDeaths}</td>
                  <td style={{ textAlign: 'center', color: '#34d399' }}>{c.avgAssists}</td>
                  <td style={{ textAlign: 'center', color: '#fca5a5' }}>{c.dpm.toLocaleString()}</td>
                  <td style={{ textAlign: 'center', color: '#10b981' }}>{c.dtpm.toLocaleString()}</td>
                  <td style={{ textAlign: 'center', color: '#fbbf24' }}>{c.gpm.toLocaleString()}</td>
                  <td style={{ textAlign: 'center', color: '#a78bfa' }}>{c.cspm}</td>
                  <td style={{ textAlign: 'center', color: '#60a5fa' }}>{c.avgControlWards}</td>
                  <td style={{ textAlign: 'center', color: '#ec4899' }}>{c.dpg}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {sorted.length === 0 && <div style={{ textAlign: 'center', padding: '60px', color: '#4b5563' }}>데이터가 없습니다</div>}
      </div>
      <div style={{ display: 'flex', gap: '16px', marginTop: '16px', flexWrap: 'wrap' }}>
        {[{ color: '#34d399', label: '승률 60%+' }, { color: '#60a5fa', label: '승률 50%+' }, { color: '#fbbf24', label: '승률 40%+' }, { color: '#f87171', label: '승률 40% 미만' }].map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: item.color }} />
            <span style={{ fontSize: '11px', color: '#6b7280' }}>{item.label}</span>
          </div>
        ))}
        <span style={{ fontSize: '11px', color: '#4b5563', marginLeft: 'auto' }}>* 헤더 클릭 시 정렬 가능</span>
      </div>
    </div>
  );
}

/* =====================================================
   개인 지표 탭
   ===================================================== */
function PlayerReport({ selectedPlayer, setSelectedPlayer, allStats, matches, currentData, radarData, reportType, setReportType, selectedLine, setSelectedLine, dataScope, setDataScope, selectedChampion, setSelectedChampion, getRankingsByLine }) {
  const isMobile = useIsMobile();

  if (!selectedPlayer || !currentData) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '16px', color: '#4b5563' }}>
        <div style={{ fontSize: '48px' }}>👤</div>
        <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#6b7280' }}>플레이어를 선택해주세요</p>
        <p style={{ fontSize: '13px', color: '#4b5563', textAlign: 'center' }}>전적 검색 탭의 경기 기록에서 플레이어를 클릭하거나,<br />아래 검색창에서 직접 찾아보세요.</p>
      </div>
    );
  }

  return (
    <div>
      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <h2 style={{ fontSize: isMobile ? '16px' : '22px', fontWeight: 'bold', color: '#60a5fa', margin: 0 }}>👤 {selectedPlayer.nickname} 분석 리포트</h2>
          <div style={{ backgroundColor: '#111827', padding: '4px', borderRadius: '10px', display: 'flex', gap: '4px', border: '1px solid #374151' }}>
            <button onClick={() => setDataScope('ALL')} style={{ padding: '5px 12px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', backgroundColor: dataScope === 'ALL' ? '#3b82f6' : 'transparent', color: dataScope === 'ALL' ? '#fff' : '#9ca3af' }}>전체</button>
            <button onClick={() => setDataScope('RECENT')} style={{ padding: '5px 12px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', backgroundColor: dataScope === 'RECENT' ? '#3b82f6' : 'transparent', color: dataScope === 'RECENT' ? '#fff' : '#9ca3af' }}>최근 10경기</button>
          </div>
        </div>
        <button onClick={() => setSelectedPlayer(null)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '20px' }}>✕</button>
      </div>

      {/* 라인 탭 */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px' }}>
        <LineTab label="전체" active={selectedLine === 'ALL'} count={selectedPlayer.fullHistory.length} winRate={Math.round((selectedPlayer.fullHistory.filter(h => h.isWin).length / selectedPlayer.fullHistory.length) * 100)} onClick={() => { setSelectedLine('ALL'); setSelectedChampion(null); }} isMobile={isMobile} />
        {['TOP', 'JNG', 'MID', 'ADC', 'SUP'].map(lane => {
          const summary = selectedPlayer.lineSummary[lane];
          if (!summary) return null;
          return <LineTab key={lane} label={lane} active={selectedLine === lane} count={summary.count} winRate={Math.round((summary.wins / summary.count) * 100)} onClick={() => { setSelectedLine(lane); setSelectedChampion(null); }} isMobile={isMobile} />;
        })}
      </div>

      {/* 스탯 카드: 모바일 2열, PC 4열 */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '10px', marginBottom: '20px' }}>
        <StatItem label="승률" value={`${currentData.winRate}%`} color="#3b82f6" isMobile={isMobile} />
        <StatItem label="KDA" value={currentData.kda} color="#10b981" rank={getRankingsByLine(selectedPlayer.nickname, 'avgKda', selectedLine, currentData)} isMobile={isMobile} />
        <StatItem label="킬 관여율" value={`${currentData.avgKp}%`} color="#f472b6" rank={getRankingsByLine(selectedPlayer.nickname, 'avgKp', selectedLine, currentData)} isMobile={isMobile} />
        <StatItem label="딜 비중" value={`${currentData.avgDmgShare}%`} color="#e97171" rank={getRankingsByLine(selectedPlayer.nickname, 'avgDmgShare', selectedLine, currentData)} isMobile={isMobile} />
        <StatItem label="퍼블율" value={`${currentData.fbRate}%`} color="#fbbf24" rank={getRankingsByLine(selectedPlayer.nickname, 'fbRate', selectedLine, currentData)} isMobile={isMobile} />
        <StatItem label="DPM" value={currentData.avgDpm} color="#8b5cf6" rank={getRankingsByLine(selectedPlayer.nickname, 'avgDpm', selectedLine, currentData)} isMobile={isMobile} />
        <StatItem label="DTPM" value={currentData.avgDtpm} color="#10b981" rank={getRankingsByLine(selectedPlayer.nickname, 'avgDtpm', selectedLine, currentData)} isMobile={isMobile} />
        <StatItem label="GPM" value={currentData.avgGpm} color="#fbbf24" rank={getRankingsByLine(selectedPlayer.nickname, 'avgGpm', selectedLine, currentData)} isMobile={isMobile} />
        <StatItem label="딜/골드" value={currentData.avgDpg} color="#ec4899" rank={getRankingsByLine(selectedPlayer.nickname, 'avgDpg', selectedLine, currentData)} isMobile={isMobile} />
        <StatItem label="CSPM" value={currentData.avgCspm} color="#10b981" rank={getRankingsByLine(selectedPlayer.nickname, 'avgCspm', selectedLine, currentData)} isMobile={isMobile} />
        <StatItem label="시야 점수" value={currentData.avgVs} color="#60a5fa" rank={getRankingsByLine(selectedPlayer.nickname, 'avgVs', selectedLine, currentData)} isMobile={isMobile} />
        <StatItem label="제어 와드" value={`${currentData.avgControlWards}개`} color="#60a5fa" rank={getRankingsByLine(selectedPlayer.nickname, 'avgControlWards', selectedLine, currentData)} isMobile={isMobile} />
      </div>

      {/* 모스트 픽 & 밴 */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
        <div style={{ backgroundColor: '#111827', padding: '5px', paddingBottom: '16px', borderRadius: '16px', border: '1px solid #374151' }}>
          <h3 style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '16px', padding: '12px 14px 0' }}>🔝 MOST PICKED</h3>
          <div style={{ display: 'flex', justifyContent: 'space-around' }}>
            {(() => {
              const counts = {};
              const sourceList = (currentData?.history && currentData.history.length > 0) ? currentData.history : (selectedPlayer?.fullHistory || []);
              sourceList.forEach(h => {
                const name = h.champion || h.champ || h.champion_name || h.championName || h.name || h.champName;
                if (name && name !== "undefined") counts[name] = (counts[name] || 0) + 1;
              });
              const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3);
              return sorted.length > 0 ? sorted.map(([name, count]) => (
                <div key={name} onClick={() => setSelectedChampion(selectedChampion === name ? null : name)} style={{ textAlign: 'center', cursor: 'pointer', opacity: selectedChampion && selectedChampion !== name ? 0.4 : 1, transform: selectedChampion === name ? 'scale(1.1)' : 'scale(1)', transition: '0.2s' }}>
                  <img src={getChampImgUrl(name)} style={{ width: '44px', height: '44px', borderRadius: '10px', border: selectedChampion === name ? '2px solid #fbbf24' : '1px solid #374151' }} alt={name} />
                  <p style={{ fontSize: '11px', color: '#fff', marginTop: '6px', fontWeight: 'bold' }}>{getChampKoName(name)}</p>
                  <p style={{ fontSize: '10px', color: '#9ca3af' }}>{count}회</p>
                </div>
              )) : <p style={{ color: '#4b5563', fontSize: '12px' }}>데이터 없음</p>;
            })()}
          </div>
        </div>
        <div style={{ backgroundColor: '#111827', padding: '5px', paddingBottom: '16px', borderRadius: '16px', border: '1px solid #374151' }}>
          <h3 style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '16px', padding: '12px 14px 0' }}>🚫 MOST BANNED</h3>
          <div style={{ display: 'flex', justifyContent: 'space-around' }}>
            {(() => {
              const banCounts = {};
              const matchesArr = matches || [];
              const history = (currentData?.history && currentData.history.length > 0) ? currentData.history : (selectedPlayer?.fullHistory || []);
              history.forEach(h => {
                const mId = h.match_id || h.matchId || h.id;
                const match = matchesArr.find(m => String(m.id) === String(mId));
                if (match) {
                  const myCurrentSide = (h.side || (h.isWin ? match.win_team : (match.win_team === 'Blue' ? 'Red' : 'Blue'))).toLowerCase();
                  const opponentBans = myCurrentSide.includes('blue') ? (match.red_bans || []) : (match.blue_bans || []);
                  opponentBans.forEach(b => {
                    if (!b.target || !b.champ) return;
                    const bTarget = String(b.target).toUpperCase().trim();
                    const pLane = String(h.lane || "").toUpperCase().trim();
                    if (bTarget === pLane) banCounts[b.champ] = (banCounts[b.champ] || 0) + 1;
                  });
                }
              });
              const sortedBans = Object.entries(banCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);
              return sortedBans.length > 0 ? sortedBans.map(([name, count]) => (
                <div key={name} style={{ textAlign: 'center' }}>
                  <img src={getChampImgUrl(name)} style={{ width: '44px', height: '44px', borderRadius: '10px', border: '1px solid #ef4444', filter: 'grayscale(0.8)' }} alt={name} />
                  <p style={{ fontSize: '11px', color: '#fff', marginTop: '6px', fontWeight: 'bold' }}>{getChampKoName(name)}</p>
                  <p style={{ fontSize: '10px', color: '#ef4444' }}>{count}회 밴</p>
                </div>
              )) : <p style={{ color: '#4b5563', fontSize: '12px', textAlign: 'center', width: '100%' }}>저격 밴 없음</p>;
            })()}
          </div>
        </div>
      </div>

      {/* 추이 그래프 & 레이더 */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : (selectedLine === 'ALL' ? '1fr' : '1.2fr 0.8fr'), gap: '16px' }}>
        <div style={{ backgroundColor: '#111827', padding: isMobile ? '16px' : '25px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <h3 style={{ fontSize: '13px', color: '#9ca3af' }}>📊 {selectedLine} {reportType.toUpperCase()} 추이</h3>
            <div style={{ backgroundColor: '#1f2937', padding: '3px', borderRadius: '8px', display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
              {['dpm', 'dtpm', 'gpm', 'cspm', 'vs', 'dpg'].map(type => (
                <button key={type} onClick={() => setReportType(type)} style={{ padding: '5px 8px', borderRadius: '5px', border: 'none', cursor: 'pointer', fontSize: '10px', backgroundColor: reportType === type ? '#3b82f6' : 'transparent', color: '#fff' }}>{type.toUpperCase()}</button>
              ))}
            </div>
          </div>
          <ResponsiveContainer height={isMobile ? 200 : 250}>
            <LineChart data={currentData.history}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
              <XAxis dataKey="date" stroke="#9ca3af" tick={{ fontSize: 9 }} />
              <YAxis stroke="#9ca3af" tick={{ fontSize: 11 }} width={40} />
              <ReTooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey={reportType} stroke="#3b82f6" strokeWidth={3} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        {selectedLine !== 'ALL' && (
          <div style={{ backgroundColor: '#111827', padding: isMobile ? '16px' : '25px', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h3 style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '12px' }}>💠 {selectedLine} 평균 대비 성향</h3>
            <ResponsiveContainer width="100%" height={isMobile ? 200 : 230}>
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                <PolarGrid stroke="#374151" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: isMobile ? 9 : 10 }} />
                <Tooltip content={<RadarCustomTooltip />} />
                <Radar name="내 지표" dataKey="player" stroke="#f97316" fill="#f97316" fillOpacity={0.5} />
                <Radar name="라인 평균" dataKey="average" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.2} />
              </RadarChart>
            </ResponsiveContainer>
            <p style={{ fontSize: '10px', color: '#4b5563', marginTop: '8px', textAlign: 'center' }}>* 지표에 탭하면 상세 비교가 가능합니다</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* =====================================================
   상대 전적 탭
   ===================================================== */
function HeadToHead({ allStats, matches, onNavigateToPlayer }) {
  const isMobile = useIsMobile();
  const [playerA, setPlayerA] = useState('');
  const [searchA, setSearchA] = useState('');
  const [sortKey, setSortKey] = useState('total');
  const [sortDir, setSortDir] = useState('desc');
  const [expandedRival, setExpandedRival] = useState(null);
  const [selectedLaneTab, setSelectedLaneTab] = useState({});

  const allNicknames = [...new Set(allStats.map(s => s.nickname))];

  const rivalData = (() => {
    if (!playerA) return null;
    const myStats = allStats.filter(s => s.nickname === playerA);
    if (myStats.length === 0) return null;
    const rivalMap = {};
    myStats.forEach(s => {
      const matchId = s.match_id;
      const myLane = String(s.lane || '').toUpperCase().trim();
      const mySide = String(s.side || '').trim();
      const match = matches.find(m => String(m.id) === String(matchId));
      if (!match) return;
      const [min, sec] = (match.duration || '20:00').split(':').map(Number);
      const mTotal = (min || 20) + (sec / 60 || 0);
      const winTeam = String(match.win_team || '').trim();
      const myIsWin = mySide === winTeam;
      const opponents = allStats.filter(op =>
        op.match_id === matchId && op.nickname !== playerA &&
        String(op.side || '').trim() !== mySide &&
        String(op.lane || '').toUpperCase().trim() === myLane
      );
      opponents.forEach(op => {
        const opName = op.nickname;
        if (!rivalMap[opName]) rivalMap[opName] = { nickname: opName, byLane: {} };
        if (!rivalMap[opName].byLane[myLane]) rivalMap[opName].byLane[myLane] = [];
        rivalMap[opName].byLane[myLane].push({
          matchId, date: match.match_date, duration: match.duration, lane: myLane, myIsWin,
          my: { champion: s.champion, kills: Number(s.kills || 0), deaths: Number(s.deaths || 0), assists: Number(s.assists || 0), damage: Number(s.damage || 0), gold: Number(s.gold || 0), cs: Number(s.cs || 0), dpm: Math.round(Number(s.damage || 0) / mTotal), gpm: Math.round(Number(s.gold || 0) / mTotal) },
          op: { champion: op.champion, kills: Number(op.kills || 0), deaths: Number(op.deaths || 0), assists: Number(op.assists || 0), damage: Number(op.damage || 0), gold: Number(op.gold || 0), cs: Number(op.cs || 0), dpm: Math.round(Number(op.damage || 0) / mTotal), gpm: Math.round(Number(op.gold || 0) / mTotal) },
        });
      });
    });

    const calcLaneStats = (games) => {
      const n = games.length || 1;
      const wins = games.filter(g => g.myIsWin).length;
      const myTotK = games.reduce((s, g) => s + g.my.kills, 0);
      const myTotD = games.reduce((s, g) => s + g.my.deaths, 0);
      const myTotA = games.reduce((s, g) => s + g.my.assists, 0);
      const opTotK = games.reduce((s, g) => s + g.op.kills, 0);
      const opTotD = games.reduce((s, g) => s + g.op.deaths, 0);
      const opTotA = games.reduce((s, g) => s + g.op.assists, 0);
      const myKdaNum = myTotD === 0 ? 9999 : (myTotK + myTotA) / myTotD;
      const opKdaNum = opTotD === 0 ? 9999 : (opTotK + opTotA) / opTotD;
      return {
        games, total: games.length, wins, losses: games.length - wins,
        winRate: Math.round((wins / games.length) * 100),
        myAvgDpm: Math.round(games.reduce((s, g) => s + g.my.dpm, 0) / n),
        opAvgDpm: Math.round(games.reduce((s, g) => s + g.op.dpm, 0) / n),
        myAvgGpm: Math.round(games.reduce((s, g) => s + g.my.gpm, 0) / n),
        opAvgGpm: Math.round(games.reduce((s, g) => s + g.op.gpm, 0) / n),
        myAvgCs: (games.reduce((s, g) => s + g.my.cs, 0) / n).toFixed(1),
        opAvgCs: (games.reduce((s, g) => s + g.op.cs, 0) / n).toFixed(1),
        myKda: myTotD === 0 ? 'Perfect' : ((myTotK + myTotA) / myTotD).toFixed(2),
        opKda: opTotD === 0 ? 'Perfect' : ((opTotK + opTotA) / opTotD).toFixed(2),
        myKdaNum, opKdaNum,
      };
    };

    return Object.values(rivalMap).map(r => {
      const lanes = Object.keys(r.byLane);
      const allGames = lanes.flatMap(l => r.byLane[l]);
      const laneStats = {};
      lanes.forEach(l => { laneStats[l] = calcLaneStats(r.byLane[l]); });
      const overall = calcLaneStats(allGames);
      const mostLane = [...lanes].sort((a, b) => r.byLane[b].length - r.byLane[a].length)[0];
      return {
        nickname: r.nickname, lanes, laneStats, overall, mostLane,
        total: overall.total, wins: overall.wins, losses: overall.losses, winRate: overall.winRate,
        myAvgDpm: overall.myAvgDpm, opAvgDpm: overall.opAvgDpm,
        myAvgGpm: overall.myAvgGpm, opAvgGpm: overall.opAvgGpm,
        myAvgCs: overall.myAvgCs, opAvgCs: overall.opAvgCs,
        latestOpChamp: [...allGames].sort((a, b) => new Date(b.date) - new Date(a.date))[0]?.op.champion,
      };
    });
  })();

  const sorted = rivalData
    ? [...rivalData].sort((a, b) => {
        const av = parseFloat(a[sortKey]) || 0;
        const bv = parseFloat(b[sortKey]) || 0;
        return sortDir === 'desc' ? bv - av : av - bv;
      })
    : [];

  const MiniBar = ({ myVal, opVal }) => {
    const a = parseFloat(myVal) || 0;
    const b = parseFloat(opVal) || 0;
    const total = a + b || 1;
    const pct = (a / total) * 100;
    const myBetter = a >= b;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
        <span style={{ color: myBetter ? '#60a5fa' : '#9ca3af', fontWeight: myBetter ? 'bold' : 'normal', width: '45px', textAlign: 'right' }}>{typeof myVal === 'number' ? myVal.toLocaleString() : myVal}</span>
        <div style={{ flex: 1, height: '5px', borderRadius: '3px', backgroundColor: '#374151', overflow: 'hidden', display: 'flex' }}>
          <div style={{ width: `${pct}%`, backgroundColor: '#3b82f6', borderRadius: '3px 0 0 3px' }} />
          <div style={{ width: `${100 - pct}%`, backgroundColor: '#ef4444', borderRadius: '0 3px 3px 0' }} />
        </div>
        <span style={{ color: !myBetter ? '#f87171' : '#9ca3af', fontWeight: !myBetter ? 'bold' : 'normal', width: '45px' }}>{typeof opVal === 'number' ? opVal.toLocaleString() : opVal}</span>
      </div>
    );
  };

  const StatBar = ({ label, myVal, opVal, myNum, opNum }) => {
    const total = myNum + opNum || 1;
    const pctA = (myNum / total) * 100;
    const aIsBetter = myNum >= opNum;
    return (
      <div style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '13px' }}>
          <span style={{ fontWeight: 'bold', color: aIsBetter ? '#60a5fa' : '#9ca3af' }}>{typeof myVal === 'number' ? myVal.toLocaleString() : myVal}</span>
          <span style={{ color: '#6b7280', fontSize: '11px' }}>{label}</span>
          <span style={{ fontWeight: 'bold', color: !aIsBetter ? '#f87171' : '#9ca3af' }}>{typeof opVal === 'number' ? opVal.toLocaleString() : opVal}</span>
        </div>
        <div style={{ height: '6px', borderRadius: '3px', backgroundColor: '#374151', overflow: 'hidden', display: 'flex' }}>
          <div style={{ width: `${pctA}%`, backgroundColor: '#3b82f6', borderRadius: '3px 0 0 3px', transition: '0.5s' }} />
          <div style={{ width: `${100 - pctA}%`, backgroundColor: '#ef4444', borderRadius: '0 3px 3px 0', transition: '0.5s' }} />
        </div>
      </div>
    );
  };

  const DetailPanel = ({ r }) => {
    const activeLane = selectedLaneTab[r.nickname] || r.lanes[0];
    const st = activeLane === 'ALL' ? r.overall : r.laneStats[activeLane];
    const multiLane = r.lanes.length > 1;
    return (
      <div style={{ backgroundColor: '#111827', borderTop: '1px solid #374151', padding: isMobile ? '16px' : '24px' }}>
        {multiLane && (
          <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
            {r.lanes.map(lane => (
              <button key={lane} onClick={() => setSelectedLaneTab(prev => ({ ...prev, [r.nickname]: lane }))}
                style={{ padding: '5px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', flexShrink: 0, backgroundColor: activeLane === lane ? '#3b82f6' : '#1f2937', color: activeLane === lane ? '#fff' : '#9ca3af', border: activeLane === lane ? '1px solid #60a5fa' : '1px solid #374151' }}>
                {lane} <span style={{ opacity: 0.7 }}>({r.laneStats[lane].total})</span>
              </button>
            ))}
            <button onClick={() => setSelectedLaneTab(prev => ({ ...prev, [r.nickname]: 'ALL' }))}
              style={{ padding: '5px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', flexShrink: 0, backgroundColor: activeLane === 'ALL' ? '#6b21a8' : '#1f2937', color: activeLane === 'ALL' ? '#fff' : '#9ca3af', border: activeLane === 'ALL' ? '1px solid #a855f7' : '1px solid #374151' }}>
              전체 ({r.overall.total})
            </button>
          </div>
        )}

        {/* 요약 카드 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', backgroundColor: '#1f2937', borderRadius: '14px', overflow: 'hidden', border: '1px solid #374151', marginBottom: '16px' }}>
          <div style={{ padding: isMobile ? '14px' : '24px', textAlign: 'center', background: 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, transparent 100%)' }}>
            <div style={{ fontSize: isMobile ? '13px' : '18px', fontWeight: '900', color: '#60a5fa', marginBottom: '10px' }}>{playerA}</div>
            <div style={{ fontSize: isMobile ? '36px' : '48px', fontWeight: '900', color: st.wins >= st.losses ? '#60a5fa' : '#4b5563', lineHeight: 1 }}>{st.wins}</div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>승리</div>
            <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px' }}>
              <div><span style={{ color: '#9ca3af' }}>KDA </span><span style={{ color: '#10b981', fontWeight: 'bold' }}>{st.myKda}</span></div>
              <div><span style={{ color: '#9ca3af' }}>DPM </span><span style={{ color: '#fca5a5', fontWeight: 'bold' }}>{st.myAvgDpm.toLocaleString()}</span></div>
              {!isMobile && <><div><span style={{ color: '#9ca3af' }}>GPM </span><span style={{ color: '#fbbf24', fontWeight: 'bold' }}>{st.myAvgGpm.toLocaleString()}</span></div><div><span style={{ color: '#9ca3af' }}>평균 CS </span><span style={{ color: '#a78bfa', fontWeight: 'bold' }}>{st.myAvgCs}</span></div></>}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '12px 16px' : '20px 28px', borderLeft: '1px solid #374151', borderRight: '1px solid #374151', minWidth: isMobile ? '70px' : '110px' }}>
            <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>대면</div>
            <div style={{ fontSize: isMobile ? '24px' : '32px', fontWeight: '900', color: '#fff' }}>{st.total}</div>
            <div style={{ marginTop: '8px', fontSize: '12px', fontWeight: 'bold', color: st.wins > st.losses ? '#60a5fa' : st.wins < st.losses ? '#f87171' : '#9ca3af' }}>
              {st.wins > st.losses ? '내 우세' : st.wins < st.losses ? '상대 우세' : '동률'}
            </div>
          </div>
          <div style={{ padding: isMobile ? '14px' : '24px', textAlign: 'center', background: 'linear-gradient(225deg, rgba(239,68,68,0.15) 0%, transparent 100%)' }}>
            <div style={{ fontSize: isMobile ? '13px' : '18px', fontWeight: '900', color: '#f87171', marginBottom: '10px' }}>{r.nickname}</div>
            <div style={{ fontSize: isMobile ? '36px' : '48px', fontWeight: '900', color: st.losses >= st.wins ? '#f87171' : '#4b5563', lineHeight: 1 }}>{st.losses}</div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>승리</div>
            <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px' }}>
              <div><span style={{ color: '#9ca3af' }}>KDA </span><span style={{ color: '#10b981', fontWeight: 'bold' }}>{st.opKda}</span></div>
              <div><span style={{ color: '#9ca3af' }}>DPM </span><span style={{ color: '#fca5a5', fontWeight: 'bold' }}>{st.opAvgDpm.toLocaleString()}</span></div>
              {!isMobile && <><div><span style={{ color: '#9ca3af' }}>GPM </span><span style={{ color: '#fbbf24', fontWeight: 'bold' }}>{st.opAvgGpm.toLocaleString()}</span></div><div><span style={{ color: '#9ca3af' }}>평균 CS </span><span style={{ color: '#a78bfa', fontWeight: 'bold' }}>{st.opAvgCs}</span></div></>}
            </div>
          </div>
        </div>

        {/* 지표 비교 바 */}
        <div style={{ backgroundColor: '#1f2937', borderRadius: '12px', padding: isMobile ? '14px' : '20px 24px', border: '1px solid #374151', marginBottom: '16px' }}>
          <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff', marginBottom: '14px' }}>📊 지표 비교</h4>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '0 40px' }}>
            <div>
              <StatBar label="KDA" myVal={st.myKda === 'Perfect' ? '∞' : st.myKda} opVal={st.opKda === 'Perfect' ? '∞' : st.opKda} myNum={st.myKdaNum} opNum={st.opKdaNum} />
              <StatBar label="DPM" myVal={st.myAvgDpm} opVal={st.opAvgDpm} myNum={st.myAvgDpm} opNum={st.opAvgDpm} />
            </div>
            <div>
              <StatBar label="GPM" myVal={st.myAvgGpm} opVal={st.opAvgGpm} myNum={st.myAvgGpm} opNum={st.opAvgGpm} />
              <StatBar label="평균 CS" myVal={st.myAvgCs} opVal={st.opAvgCs} myNum={parseFloat(st.myAvgCs)} opNum={parseFloat(st.opAvgCs)} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '16px', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #374151' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '12px', height: '6px', borderRadius: '3px', backgroundColor: '#3b82f6' }} /><span style={{ fontSize: '11px', color: '#6b7280' }}>{playerA}</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '12px', height: '6px', borderRadius: '3px', backgroundColor: '#ef4444' }} /><span style={{ fontSize: '11px', color: '#6b7280' }}>{r.nickname}</span></div>
          </div>
        </div>

        {/* 경기 목록 */}
        <div style={{ backgroundColor: '#1f2937', borderRadius: '12px', padding: isMobile ? '14px' : '20px 24px', border: '1px solid #374151' }}>
          <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff', marginBottom: '12px' }}>🗂️ 경기 목록</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {st.games.map((g, gi) => (
              <div key={gi} style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '8px', backgroundColor: '#111827', borderRadius: '10px', padding: '10px 12px', border: '1px solid #374151' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <img src={getChampImgUrl(g.my.champion)} style={{ width: '30px', height: '30px', borderRadius: '6px', border: `2px solid ${g.myIsWin ? '#3b82f6' : '#374151'}`, flexShrink: 0 }} alt="" />
                  <div>
                    <div style={{ fontSize: '11px', color: g.myIsWin ? '#60a5fa' : '#6b7280', fontWeight: 'bold' }}>{g.myIsWin ? '✓ 승' : '✗ 패'}</div>
                    <div style={{ fontSize: '10px', color: '#9ca3af' }}>{getChampKoName(g.my.champion)}</div>
                    <div style={{ fontSize: '11px', color: '#d1d5db' }}>{g.my.kills}/{g.my.deaths}/{g.my.assists}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'center', minWidth: '55px' }}>
                  <div style={{ fontSize: '9px', color: '#4b5563' }}>{g.date}</div>
                  <div style={{ fontSize: '10px', color: '#6b7280' }}>{g.duration}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', color: !g.myIsWin ? '#f87171' : '#6b7280', fontWeight: 'bold' }}>{!g.myIsWin ? '✓ 승' : '✗ 패'}</div>
                    <div style={{ fontSize: '10px', color: '#9ca3af' }}>{getChampKoName(g.op.champion)}</div>
                    <div style={{ fontSize: '11px', color: '#d1d5db' }}>{g.op.kills}/{g.op.deaths}/{g.op.assists}</div>
                  </div>
                  <img src={getChampImgUrl(g.op.champion)} style={{ width: '30px', height: '30px', borderRadius: '6px', border: `2px solid ${!g.myIsWin ? '#ef4444' : '#374151'}`, flexShrink: 0 }} alt="" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '10px', fontWeight: 'bold' }}>📌 플레이어 선택 — 상대 팀 같은 라인 전적만 집계됩니다</div>
        {playerA ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#111827', padding: '12px 16px', borderRadius: '12px', border: '2px solid #3b82f6', maxWidth: '400px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#3b82f6', flexShrink: 0 }} />
            <span style={{ fontWeight: 'bold', fontSize: '15px', flex: 1 }}>{playerA}</span>
            <button onClick={() => { setPlayerA(''); setSearchA(''); setExpandedRival(null); setSelectedLaneTab({}); }} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '18px' }}>✕</button>
          </div>
        ) : (
          <div style={{ position: 'relative', maxWidth: '400px' }}>
            <input type="text" placeholder="플레이어 닉네임 검색" value={searchA} onChange={e => setSearchA(e.target.value)} autoFocus
              style={{ width: '100%', backgroundColor: '#111827', border: '2px solid #3b82f6', borderRadius: '12px', padding: '12px 16px', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
            {searchA && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#1f2937', border: '1px solid #3b82f644', borderRadius: '10px', marginTop: '4px', zIndex: 10, maxHeight: '220px', overflowY: 'auto' }}>
                {allNicknames.filter(n => n.toLowerCase().includes(searchA.toLowerCase())).map(n => (
                  <div key={n} onClick={() => { setPlayerA(n); setSearchA(''); }}
                    style={{ padding: '10px 16px', cursor: 'pointer', fontSize: '14px', borderBottom: '1px solid #374151' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#374151'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >{n}</div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {!playerA && (
        <div style={{ textAlign: 'center', padding: '50px', color: '#4b5563' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚔️</div>
          <p style={{ fontSize: '15px' }}>분석할 플레이어를 선택하세요</p>
          <p style={{ fontSize: '12px', marginTop: '8px', color: '#374151' }}>상대 팀 같은 라인과의 전적만 집계됩니다</p>
        </div>
      )}

      {playerA && rivalData && rivalData.length === 0 && (
        <div style={{ textAlign: 'center', padding: '50px', color: '#4b5563' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>😶</div>
          <p style={{ fontSize: '15px' }}>상대 라인 전적 데이터가 없습니다</p>
        </div>
      )}

      {playerA && sorted.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '4px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '12px', height: '5px', borderRadius: '3px', backgroundColor: '#3b82f6' }} /><span style={{ fontSize: '11px', color: '#6b7280' }}>{playerA}</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '12px', height: '5px', borderRadius: '3px', backgroundColor: '#ef4444' }} /><span style={{ fontSize: '11px', color: '#6b7280' }}>상대</span></div>
            <span style={{ fontSize: '11px', color: '#4b5563', marginLeft: 'auto' }}>총 {sorted.length}명</span>
          </div>

          {sorted.map((r, i) => {
            const winColor = r.winRate >= 60 ? '#34d399' : r.winRate >= 50 ? '#60a5fa' : r.winRate >= 40 ? '#fbbf24' : '#f87171';
            const isExpanded = expandedRival === r.nickname;
            return (
              <div key={r.nickname} style={{ borderRadius: '14px', border: isExpanded ? '2px solid #3b82f6' : '1px solid #374151', overflow: 'hidden', transition: '0.2s' }}>
                <div onClick={() => setExpandedRival(isExpanded ? null : r.nickname)}
                  style={{ display: 'flex', alignItems: 'center', backgroundColor: isExpanded ? 'rgba(59,130,246,0.1)' : i % 2 === 0 ? '#1a2030' : '#1f2937', cursor: 'pointer', padding: '12px 16px', gap: '12px' }}>
                  <img src={getChampImgUrl(r.latestOpChamp)} alt="" style={{ width: '36px', height: '36px', borderRadius: '8px', border: '1px solid #374151', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '14px' }}>{r.nickname}</div>
                    <div style={{ fontSize: '11px', color: '#6b7280' }}>{r.mostLane} · {r.total}경기</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : '20px', flexShrink: 0 }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>승/패</div>
                      <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                        <span style={{ color: '#60a5fa' }}>{r.wins}</span>
                        <span style={{ color: '#4b5563', margin: '0 3px' }}>/</span>
                        <span style={{ color: '#f87171' }}>{r.losses}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>승률</div>
                      <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '6px', backgroundColor: `${winColor}22`, color: winColor, fontWeight: 'bold', fontSize: '13px' }}>{r.winRate}%</span>
                    </div>
                    {!isMobile && (
                      <>
                        <div style={{ textAlign: 'center', minWidth: '100px' }}>
                          <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>DPM</div>
                          <MiniBar myVal={r.myAvgDpm} opVal={r.opAvgDpm} />
                        </div>
                        <div style={{ textAlign: 'center', minWidth: '100px' }}>
                          <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>GPM</div>
                          <MiniBar myVal={r.myAvgGpm} opVal={r.opAvgGpm} />
                        </div>
                        <div style={{ textAlign: 'center', minWidth: '100px' }}>
                          <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>평균 CS</div>
                          <MiniBar myVal={r.myAvgCs} opVal={r.opAvgCs} />
                        </div>
                      </>
                    )}
                    <div style={{ color: '#6b7280', fontSize: '13px', flexShrink: 0 }}>{isExpanded ? '▲' : '▼'}</div>
                  </div>
                </div>
                {isExpanded && <DetailPanel r={r} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* =====================================================
   메인 앱
   ===================================================== */
function App() {
  const isMobile = useIsMobile();
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
  const [playerSearchTerm, setPlayerSearchTerm] = useState('');
  const [mainTab, setMainTab] = useState('search');

  useEffect(() => { fetchInitialData(); }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const { data: mData } = await supabase.from('matches').select('*').order('match_date', { ascending: false });
      const { data: sDataTotal } = await supabase.from('match_stats').select('*, champion, match_id, matches:match_id(*)');
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
      const { data: sData, error } = await supabase.from('match_stats').select('nickname, damage, gold, vision_score, control_wards, damage_taken, cs, kills, deaths, assists, side, first_blood, multi_kill, lane, champion').eq('match_id', matchId);
      if (error) throw error;
      if (sData) {
        const sortedData = sData.sort((a, b) => (laneOrder[String(a.lane || 'MID').toUpperCase()] || 99) - (laneOrder[String(b.lane || 'MID').toUpperCase()] || 99));
        setPlayerStats(sortedData.map(item => ({
          nickname: item.nickname || 'Unknown', damage: Number(item.damage || 0), gold: Number(item.gold || 0),
          vision_score: Number(item.vision_score || 0), control_wards: Number(item.control_wards || 0),
          damage_taken: Number(item.damage_taken || 0), cs: Number(item.cs || 0), kills: Number(item.kills || 0),
          deaths: Number(item.deaths || 0), assists: Number(item.assists || 0), side: item.side,
          firstBlood: item.first_blood, multiKill: item.multi_kill, lane: item.lane, champion: item.champion
        })));
      }
    } catch (err) { console.error(err); }
  };

  const handlePlayerClick = (nickname, navigateToPlayer = false) => {
    try {
      const history = allStats.filter(s => s.nickname === nickname).map(s => {
        const mySide = String(s.side || '').trim().toLowerCase();
        const winSide = String(s.matches?.win_team || '').trim().toLowerCase();
        const [min, sec] = (s.matches?.duration || "20:00").split(':').map(Number);
        const mTotal = (min || 20) + (sec / 60 || 0);
        const teamStats = allStats.filter(st => st.match_id === s.match_id && st.side === s.side);
        const teamTotalDmg = teamStats.reduce((sum, p) => sum + Number(p.damage || 0), 0);
        const teamTotalKills = teamStats.reduce((sum, p) => sum + Number(p.kills || 0), 0);
        const isWinResult = mySide !== "" && winSide !== "" && mySide === winSide;
        return {
          date: s.matches?.match_date || 'Unknown', lane: String(s.lane || 'MID').toUpperCase().trim(),
          champion: s.champion, match_id: s.match_id, isWin: isWinResult,
          dpm: Math.round(Number(s.damage || 0) / mTotal), dtpm: Math.round(Number(s.damage_taken || 0) / mTotal),
          dmgShare: teamTotalDmg > 0 ? Number(((Number(s.damage || 0) / teamTotalDmg) * 100).toFixed(1)) : 0,
          gpm: Math.round(Number(s.gold || 0) / mTotal), cspm: (Number(s.cs || 0) / mTotal).toFixed(1),
          vs: Number(s.vision_score || 0), controlWards: Number(s.control_wards || 0),
          isFB: s.first_blood === true || s.first_blood === 'true' || s.first_blood === 1,
          dpg: Number(s.gold || 0) > 0 ? (Number(s.damage || 0) / Number(s.gold || 0)).toFixed(2) : "0.00",
          kp: teamTotalKills > 0 ? Math.round(((Number(s.kills || 0) + Number(s.assists || 0)) / teamTotalKills) * 100) : 0,
          damage: Number(s.damage || 0), damage_taken: Number(s.damage_taken || 0), gold: Number(s.gold || 0),
          cs: Number(s.cs || 0), vision_score: Number(s.vision_score || 0), matchMinutes: mTotal,
          kills: Number(s.kills || 0), deaths: Number(s.deaths || 0), assists: Number(s.assists || 0)
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
        setSelectedChampion(null);
        if (navigateToPlayer) {
          setMainTab('player');
          setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
        } else {
          setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 100);
        }
      }
    } catch (error) { console.error("리포트 생성 중 에러 발생:", error); }
  };

  const getRankingsByLine = (nickname, field, line, currentData) => {
    if (!allStats.length || !currentData) return null;
    const lineStats = line === 'ALL' ? allStats : allStats.filter(s => String(s.lane || '').toUpperCase().trim() === line);
    const nicknames = [...new Set(lineStats.map(s => s.nickname))];
    const otherAverages = nicknames.filter(name => name !== nickname).map(name => {
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
      const stats = {
        avgDpm: tDmg / (tMin || 1), avgGpm: tGold / (tMin || 1), avgCspm: tCs / (tMin || 1),
        avgVs: tVis / (pHistory.length || 1), avgDpg: tGold > 0 ? tDmg / tGold : 0,
        avgKda: tD === 0 ? 99999 : (tK + tA) / tD,
        avgDtpm: tDtpm / (tMin || 1), avgDmgShare: (tDmgShare / (pHistory.length || 1)) * 100,
        fbRate: (tFB / (pHistory.length || 1)) * 100, avgControlWards: tCW / (pHistory.length || 1),
        avgKp: (tKpSum / (pHistory.length || 1)) * 100
      };
      return stats[field];
    });
    let myVal = currentData[field];
    if (myVal === undefined) {
      const shortKey = field.replace('avg', '').toLowerCase();
      myVal = currentData[shortKey] || currentData[field.replace('avg', 'avg_')] || 0;
    }
    let myCurrentScore;
    if (field === 'avgKda' || field === 'kda') {
      const isPerfect = (myVal === "Perfect" || String(myVal).includes("Perfect") || (!isFinite(parseFloat(myVal)) && parseFloat(myVal) > 0));
      myCurrentScore = isPerfect ? 99999 : (parseFloat(String(myVal).replace(/[^0-9.]/g, '')) || 0);
    } else {
      myCurrentScore = parseFloat(String(myVal).replace(/[^0-9.]/g, '')) || 0;
    }
    const combined = [...otherAverages, myCurrentScore].sort((a, b) => b - a);
    const rank = combined.indexOf(myCurrentScore) + 1;
    return rank >= 1 && rank <= 3 ? { line: line === 'ALL' ? 'ALL' : line, rank } : null;
  };

  const getRadarData = (currentData, line) => {
    if (!currentData || !allStats.length || line === 'ALL') return [];
    const lineStats = allStats.filter(s => String(s.lane || '').toUpperCase().trim() === line);
    const calculateLineAvg = (stats) => {
      let tMin = 0, tDmg = 0, tGold = 0, tCs = 0, tVis = 0, tK = 0, tA = 0, tD = 0;
      stats.forEach(s => {
        const [min, sec] = (s.matches?.duration || "20:00").split(':').map(Number);
        const m = min + (sec / 60) || 20; tMin += m;
        tDmg += Number(s.damage || 0); tGold += Number(s.gold || 0); tCs += Number(s.cs || 0);
        tVis += Number(s.vision_score || 0); tK += Number(s.kills || 0); tA += Number(s.assists || 0); tD += Number(s.deaths || 0);
      });
      const safeM = tMin > 0 ? tMin : 1; const count = stats.length > 0 ? stats.length : 1;
      return { avgDpm: tDmg / safeM, avgGpm: tGold / safeM, avgVs: tVis / count, avgCspm: tCs / safeM, kda: tD === 0 ? Math.max(10, tK + tA) : (tK + tA) / tD, avgDpg: tGold > 0 ? tDmg / tGold : 0 };
    };
    const lineActual = calculateLineAvg(lineStats);
    const keys = [
      { key: 'avgDpm', label: '전투' }, { key: 'avgGpm', label: '성장' },
      { key: 'avgVs', label: '시야' }, { key: 'avgCspm', label: '파밍' },
      { key: 'kda', label: '생존' }, { key: 'avgDpg', label: '효율' }
    ];
    return keys.map(k => {
      const lAvg = lineActual[k.key] || 1;
      let pVal = currentData[k.key];
      let isPerfect = false;
      if (k.key === 'kda') {
        if (pVal === "Perfect" || String(pVal).includes("Perfect") || !isFinite(parseFloat(pVal))) isPerfect = true;
      }
      const pAvg = isPerfect ? lAvg * 2 : (parseFloat(String(pVal).replace(/[^0-9.]/g, '')) || 0);
      const playerPoint = isPerfect ? 100 : Math.min(100, (pAvg / lAvg) * 50);
      return { subject: k.label, player: playerPoint, average: 50, actualPlayer: isPerfect ? "Perfect" : pAvg.toFixed(k.key === 'avgCspm' || k.key === 'avgDpg' ? 2 : 1), actualAvg: lAvg.toFixed(k.key === 'avgCspm' || k.key === 'avgDpg' ? 2 : 1) };
    });
  };

  const getFilteredData = () => {
    if (!selectedPlayer) return null;
    let baseData = selectedLine === 'ALL' ? selectedPlayer.fullHistory : selectedPlayer.fullHistory.filter(h => h.lane === selectedLine);
    if (selectedChampion) baseData = baseData.filter(h => h.champion === selectedChampion);
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
  const radarData = (selectedPlayer && currentData) ? getRadarData(currentData, selectedLine) : [];

  const searchResults = [...new Set(allStats.map(s => s.nickname))]
    .filter(name => name.toLowerCase().includes(searchTerm.toLowerCase()))
    .map(name => {
      const pHistory = allStats.filter(s => s.nickname === name);
      const wins = pHistory.filter(s => String(s.side || '').trim().toLowerCase() === String(s.matches?.win_team || '').trim().toLowerCase()).length;
      return { nickname: name, totalGames: pHistory.length, winRate: Math.round((wins / pHistory.length) * 100), mostLane: Object.entries(pHistory.reduce((acc, curr) => { const lane = String(curr.lane || 'MID').toUpperCase(); acc[lane] = (acc[lane] || 0) + 1; return acc; }, {})).sort((a, b) => b[1] - a[1])[0][0] };
    });

  const playerSearchResults = [...new Set(allStats.map(s => s.nickname))]
    .filter(name => name.toLowerCase().includes(playerSearchTerm.toLowerCase()))
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

  /* 탭 설정: 모바일에선 아이콘만 */
  const tabs = [
    { id: 'search', label: '전적 검색', icon: '🔍' },
    { id: 'champion', label: '챔피언 분석', icon: '⚔️' },
    { id: 'player', label: selectedPlayer ? `${selectedPlayer.nickname}` : '개인 지표', icon: '👤' },
    { id: 'h2h', label: '상대 전적', icon: '🆚' },
  ];

  if (loading) return <div style={{ color: '#fff', textAlign: 'center', marginTop: '100px' }}>데이터 로딩 중...</div>;

  return (
    <div style={{ backgroundColor: '#0a0e17', minHeight: '100vh', width: '100%', margin: 0, padding: 0, color: '#f3f4f6', overflowX: 'hidden' }}>
      <header style={{ textAlign: 'center', padding: isMobile ? '32px 0 0 0' : '80px 0 0 0', background: 'linear-gradient(to bottom, #1e293b 0%, #0a0e17 100%)', borderBottom: '1px solid #1e293b' }}>
        <h1 style={{ fontSize: isMobile ? '36px' : '64px', fontWeight: '900', margin: isMobile ? '0 0 20px 0' : '0 0 40px 0', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', lineHeight: '1.2' }}>
          <span style={{ background: 'linear-gradient(180deg, #ffffff 30%, #a1a1aa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>방주</span>
          <span style={{ color: '#3b82f6', fontStyle: 'italic', textShadow: '0 0 30px rgba(59, 130, 246, 0.6)' }}>.GG</span>
        </h1>
        {/* 탭 네비게이션 */}
        <div style={{ display: 'flex', justifyContent: 'center', borderBottom: '2px solid #1e293b' }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setMainTab(tab.id)} style={{
              padding: isMobile ? '10px 0' : '14px 36px',
              width: isMobile ? '25%' : 'auto',
              border: 'none',
              borderBottom: mainTab === tab.id ? '2px solid #3b82f6' : '2px solid transparent',
              backgroundColor: 'transparent',
              color: mainTab === tab.id ? '#60a5fa' : tab.id === 'player' && selectedPlayer ? '#a78bfa' : '#6b7280',
              fontSize: isMobile ? '20px' : '15px',
              fontWeight: mainTab === tab.id ? '700' : '500',
              cursor: 'pointer', transition: '0.2s', marginBottom: '-2px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px'
            }}>
              <span>{tab.icon}</span>
              {!isMobile && <span style={{ letterSpacing: '0.3px' }}>{tab.label}</span>}
              {isMobile && <span style={{ fontSize: '9px', letterSpacing: '0px' }}>{tab.label.length > 5 ? tab.label.slice(0, 4) + '…' : tab.label}</span>}
            </button>
          ))}
        </div>
      </header>

      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '30px', padding: isMobile ? '20px 12px 80px 12px' : '40px 20px 100px 20px' }}>

        {/* ===== 전적 검색 탭 ===== */}
        {mainTab === 'search' && (
          <>
            {/* 검색 */}
            <section style={{ backgroundColor: '#1f2937', padding: isMobile ? '16px' : '30px', borderRadius: '16px', border: '1px solid #374151', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <div style={{ position: 'relative', width: '100%', maxWidth: '600px' }}>
                <input type="text" placeholder="플레이어 닉네임을 검색하세요" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: '100%', backgroundColor: '#111827', border: '2px solid #3b82f6', borderRadius: '12px', padding: '13px 18px', color: '#fff', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              {searchTerm && (
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px', width: '100%' }}>
                  {searchResults.map(player => (
                    <div key={player.nickname} onClick={() => { handlePlayerClick(player.nickname, true); }}
                      style={{ backgroundColor: '#111827', padding: '12px', borderRadius: '10px', border: '1px solid #374151', cursor: 'pointer' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>{player.nickname}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#9ca3af' }}>
                        <span>{player.mostLane}</span>
                        <span style={{ color: player.winRate >= 50 ? '#3b82f6' : '#ef4444' }}>{player.winRate}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* 경기기록 + 승률: 모바일에선 세로 */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '16px' : '25px' }}>
              <section style={{ backgroundColor: '#1f2937', padding: isMobile ? '16px' : '25px', borderRadius: '16px', maxHeight: '350px', display: 'flex', flexDirection: 'column' }}>
                <h2 style={{ fontSize: '16px', marginBottom: '16px', color: '#ffffff' }}>⚔️ 경기 기록</h2>
                <div className="custom-scroll" style={{ overflowY: 'auto', gap: '8px', display: 'flex', flexDirection: 'column' }}>
                  {Object.keys(groupedMatches).map(date => (
                    <div key={date}>
                      <div onClick={() => toggleDate(date)} style={{ padding: '10px 14px', backgroundColor: '#111827', borderRadius: '10px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #374151', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '13px' }}>📅 {date}</span>
                        <span style={{ fontSize: '11px', color: '#9ca3af' }}>{groupedMatches[date].length}경기 {openDates[date] ? '▲' : '▼'}</span>
                      </div>
                      {openDates[date] && (
                        <div style={{ paddingLeft: '8px', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
                          {groupedMatches[date].map(m => (
                            <div key={m.id} onClick={() => { setSelectedMatchId(m.id); fetchMatchStats(m.id); }}
                              style={{ padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', backgroundColor: selectedMatchId === m.id ? '#374151' : '#111827', borderLeft: `4px solid ${m.win_team === 'Blue' ? '#3b82f6' : '#ef4444'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', border: '1px solid #1f2937' }}>
                              <span style={{ color: m.win_team === 'Blue' ? '#60a5fa' : '#f87171', fontWeight: 'bold' }}>{m.win_team} 승</span>
                              <span style={{ color: '#6b7280', fontSize: '12px' }}>({m.duration})</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
              <section style={{ backgroundColor: '#1f2937', padding: isMobile ? '16px' : '25px', borderRadius: '16px', position: 'relative', height: '280px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <h2 style={{ fontSize: '16px', marginBottom: '8px', width: '100%', color: '#ffffff' }}>📊 진영 승률</h2>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={[{ name: 'Blue', value: winLossStats.Blue }, { name: 'Red', value: winLossStats.Red }]} innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value" stroke="none">
                      <Cell fill="#3b82f6" /><Cell fill="#ef4444" />
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ position: 'absolute', top: '80%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Blue 승률</div>
                  <div style={{ fontSize: '32px', fontWeight: '900', color: '#3b82f6' }}>{matches.length > 0 ? Math.round((winLossStats.Blue / matches.length) * 100) : 0}%</div>
                </div>
              </section>
            </div>

            {/* 경기 상세 테이블: 모바일에선 세로 */}
            {selectedMatchId && playerStats.length > 0 && (
              <section style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '14px' : '20px' }}>
                {['Blue', 'Red'].map(side => {
                  const currentMatch = matches.find(m => m.id === selectedMatchId);
                  const bans = side === 'Blue' ? (currentMatch?.blue_bans || []) : (currentMatch?.red_bans || []);
                  return (
                    <div key={side} style={{ backgroundColor: '#1f2937', borderRadius: '14px', overflow: 'hidden', border: `1px solid ${side === 'Blue' ? '#3b82f6' : '#ef4444'}` }}>
                      <div style={{ backgroundColor: side === 'Blue' ? 'rgba(59,130,246,0.15)' : 'rgba(239,68,68,0.15)', padding: '10px 16px', borderBottom: '1px solid #374151' }}>
                        <span style={{ fontWeight: '800', color: side === 'Blue' ? '#60a5fa' : '#f87171', fontSize: '13px' }}>{side.toUpperCase()} TEAM</span>
                      </div>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: isMobile ? '12px' : '13px', tableLayout: 'fixed' }}>
                        <thead style={{ backgroundColor: '#111827', color: '#9ca3af' }}>
                          <tr>
                            <th style={{ padding: '10px 8px', textAlign: 'left', width: isMobile ? '50%' : '54%' }}>플레이어</th>
                            <th style={{ padding: '10px 4px', width: '15%' }}>KDA</th>
                            <th style={{ padding: '10px 4px', width: '15%' }}>시야</th>
                            <th style={{ padding: '10px 4px', width: '20%' }}>딜량</th>
                          </tr>
                        </thead>
                        <tbody>
                          {playerStats.filter(p => p.side === side).map((p, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #374151' }}>
                              <td style={{ padding: '10px 8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <img src={getChampImgUrl(p.champion)} alt="" style={{ width: '28px', height: '28px', borderRadius: '50%', border: `2px solid ${side === 'Blue' ? '#3b82f6' : '#ef4444'}`, flexShrink: 0 }} />
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: 0, flex: 1 }}>
                                    <span onClick={() => handlePlayerClick(p.nickname, true)}
                                      style={{ fontWeight: 'bold', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: isMobile ? '60px' : '85px', cursor: 'pointer', fontSize: isMobile ? '12px' : '13px' }}>{p.nickname}</span>
                                    <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                                      {(p.firstBlood === true || p.firstBlood === 'true') && <Badge label="퍼블" color="#f59e0b" />}
                                      {getMultiKillLabel(p.multiKill) && <Badge label={getMultiKillLabel(p.multiKill)} color="#ef4444" />}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td style={{ textAlign: 'center', color: '#d1d5db' }}>{p.kills}/{p.deaths}/{p.assists}</td>
                              <td style={{ textAlign: 'center', color: '#60a5fa' }}>{p.vision_score}/{p.control_wards}</td>
                              <td style={{ textAlign: 'center', color: '#fca5a5' }}>{isMobile ? Math.round(p.damage / 1000) + 'k' : p.damage.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot style={{ backgroundColor: '#111827', borderTop: '2px solid #374151' }}>
                          <tr>
                            <td colSpan="4" style={{ padding: '8px 12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '11px', fontWeight: 'bold', color: side === 'Blue' ? '#3b82f6' : '#ef4444' }}>BANS</span>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                  {bans.map((ban, idx) => (
                                    <div key={idx} style={{ width: '22px', height: '22px', borderRadius: '4px', overflow: 'hidden', border: '1px solid #374151' }}>
                                      <img src={getChampImgUrl(ban.champ)} alt="ban" style={{ width: '100%', height: '100%', filter: 'grayscale(100%) opacity(0.6)' }} />
                                    </div>
                                  ))}
                                  {bans.length === 0 && [1,2,3,4,5].map(n => (
                                    <div key={n} style={{ width: '22px', height: '22px', borderRadius: '4px', backgroundColor: '#0a0e17', border: '1px solid #1f2937' }} />
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

            {/* 경기 그래프 */}
            <section style={{ backgroundColor: '#1f2937', padding: isMobile ? '16px' : '35px', borderRadius: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#ffffff' }}>경기 그래프</h2>
                <div style={{ backgroundColor: '#111827', padding: '4px', borderRadius: '10px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {[{ id: 'damage', label: '딜', color: '#e97171' }, { id: 'gold', label: '골드', color: '#fbbf24' }, { id: 'vision_score', label: '시야', color: '#60a5fa' }, { id: 'damage_taken', label: '받은딜', color: '#10b981' }, { id: 'cs', label: 'CS', color: '#a78bfa' }].map(t => (
                    <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ padding: '6px 10px', borderRadius: '7px', border: 'none', cursor: 'pointer', backgroundColor: activeTab === t.id ? t.color : 'transparent', color: activeTab === t.id ? (t.id === 'gold' ? '#000' : '#fff') : '#9ca3af', fontSize: '12px' }}>{t.label}</button>
                  ))}
                </div>
              </div>
              <ResponsiveContainer height={isMobile ? 220 : 350}>
                <BarChart data={playerStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis dataKey="nickname" stroke="#9ca3af" height={50} dy={8} tick={{ fontSize: isMobile ? 10 : 13 }} />
                  <YAxis stroke="#9ca3af" tick={{ fontSize: isMobile ? 10 : 13 }} width={isMobile ? 35 : 50} />
                  <ReTooltip content={<CustomTooltip />} />
                  <Bar dataKey={activeTab} fill={activeTab === 'damage' ? '#e97171' : activeTab === 'gold' ? '#fbbf24' : activeTab === 'vision_score' ? '#60a5fa' : activeTab === 'damage_taken' ? '#10b981' : '#a78bfa'}
                    radius={[5, 5, 0, 0]} barSize={isMobile ? 20 : 30} onClick={(d) => handlePlayerClick(d.nickname, true)}>
                    <LabelList dataKey={activeTab} position="top" fill="#9ca3af" fontSize={isMobile ? 8 : 10}
                      formatter={isMobile ? (v) => v >= 1000 ? Math.round(v/1000)+'k' : v : undefined} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <p style={{ fontSize: '11px', color: '#4b5563', marginTop: '8px', textAlign: 'center' }}>* 막대 클릭 시 개인 지표 탭으로 이동합니다</p>
            </section>
          </>
        )}

        {/* ===== 챔피언 분석 탭 ===== */}
        {mainTab === 'champion' && (
          <section style={{ backgroundColor: '#1f2937', padding: isMobile ? '16px' : '35px', borderRadius: '16px', border: '1px solid #374151' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff', marginBottom: '20px' }}>⚔️ 챔피언 분석</h2>
            <ChampionAnalysis allStats={allStats} matches={matches} />
          </section>
        )}

        {/* ===== 개인 지표 탭 ===== */}
        {mainTab === 'player' && (
          <section style={{ backgroundColor: '#1f2937', padding: isMobile ? '16px' : '35px', borderRadius: '16px', border: selectedPlayer ? '2px solid #3b82f6' : '1px solid #374151' }}>
            {!selectedPlayer && (
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff', marginBottom: '14px' }}>👤 개인 지표</h2>
                <div style={{ position: 'relative', width: '100%', maxWidth: '500px', margin: '0 auto' }}>
                  <input type="text" placeholder="플레이어 닉네임을 검색하세요" value={playerSearchTerm} onChange={(e) => setPlayerSearchTerm(e.target.value)}
                    style={{ width: '100%', backgroundColor: '#111827', border: '2px solid #3b82f6', borderRadius: '12px', padding: '13px 18px', color: '#fff', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} autoFocus />
                </div>
                {playerSearchTerm && (
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px', marginTop: '14px', maxWidth: '700px', margin: '14px auto 0' }}>
                    {playerSearchResults.map(player => (
                      <div key={player.nickname} onClick={() => { handlePlayerClick(player.nickname, false); setPlayerSearchTerm(''); }}
                        style={{ backgroundColor: '#111827', padding: '12px', borderRadius: '10px', border: '1px solid #374151', cursor: 'pointer', transition: '0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = '#3b82f6'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = '#374151'}>
                        <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '4px' }}>{player.nickname}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#9ca3af' }}>
                          <span>{player.mostLane}</span>
                          <span style={{ color: player.winRate >= 50 ? '#3b82f6' : '#ef4444' }}>{player.winRate}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            <PlayerReport
              selectedPlayer={selectedPlayer} setSelectedPlayer={setSelectedPlayer}
              allStats={allStats} matches={matches} currentData={currentData} radarData={radarData}
              reportType={reportType} setReportType={setReportType}
              selectedLine={selectedLine} setSelectedLine={setSelectedLine}
              dataScope={dataScope} setDataScope={setDataScope}
              selectedChampion={selectedChampion} setSelectedChampion={setSelectedChampion}
              getRankingsByLine={getRankingsByLine}
            />
          </section>
        )}

        {/* ===== 상대 전적 탭 ===== */}
        {mainTab === 'h2h' && (
          <section style={{ backgroundColor: '#1f2937', padding: isMobile ? '16px' : '35px', borderRadius: '16px', border: '1px solid #374151' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff', marginBottom: '20px' }}>🆚 상대 전적</h2>
            <HeadToHead allStats={allStats} matches={matches} onNavigateToPlayer={(nickname) => { handlePlayerClick(nickname, true); }} />
          </section>
        )}
      </div>
    </div>
  );
}

const LineTab = ({ label, active, count, winRate, onClick, isMobile }) => (
  <div onClick={onClick} style={{ minWidth: isMobile ? '70px' : '90px', padding: isMobile ? '8px 6px' : '10px', borderRadius: '10px', cursor: 'pointer', textAlign: 'center', flexShrink: 0, backgroundColor: active ? '#3b82f6' : '#111827', border: active ? '1px solid #60a5fa' : '1px solid #374151', color: active ? '#fff' : '#9ca3af' }}>
  <div style={{ fontSize: isMobile ? '12px' : '14px', fontWeight: 'bold' }}>{label}</div>
  <div style={{ fontSize: '10px', opacity: 0.8 }}>{count}판 {winRate !== undefined && `(${winRate}%)`}</div>
</div>
);

const StatItem = ({ label, value, color, rank, isMobile }) => {
  const getOrdinal = (n) => n + (["th", "st", "nd", "rd"][(n % 100 > 10 && n % 100 < 14) ? 0 : Math.min(n % 10, 3)]);
  let border = '1px solid #374151';
  if (rank) {
    if (rank.rank === 1) border = '2px solid #fbbf24';
    else if (rank.rank === 2) border = '2px solid #94a3b8';
    else if (rank.rank === 3) border = '2px solid #92400e';
  }
  return (
    <div style={{ backgroundColor: '#111827', padding: isMobile ? '10px 8px' : '15px', borderRadius: '12px', textAlign: 'center', position: 'relative', border }}>
      {rank && (
        <div style={{ position: 'absolute', top: '4px', left: '4px', backgroundColor: rank.rank === 1 ? '#fbbf24' : rank.rank === 2 ? '#94a3b8' : '#92400e', color: rank.rank === 1 ? '#000' : '#fff', fontSize: '7px', padding: '1px 4px', borderRadius: '3px', fontWeight: 'bold' }}>
          {rank.line === 'ALL' ? `ALL ${getOrdinal(rank.rank)}` : `${rank.line} ${getOrdinal(rank.rank)}`}
        </div>
      )}
      <p style={{ fontSize: isMobile ? '11px' : '13px', color: '#9ca3af', marginBottom: '5px' }}>{label}</p>
      <p style={{ fontSize: isMobile ? '14px' : '17px', fontWeight: 'bold', color }}>{value}</p>
    </div>
  );
};

export default App;
