/* 🏆 HOME KABADDI TEAM - TANGLISH DATA & LOCAL STORAGE ENGINE */

const INITIAL_KABADDI_DATA = {
  activeRole: 'coach', // 'coach' | 'player'
  activePlayerId: 1,   // Current player (Arun)
  
  coachProfile: {
    name: 'Coach Rajan',
    phone: '+91 98765 43210',
    email: 'coach.rajan@kabaddi.com',
    experience: '12 Varuda Anubavam (Pro Kabaddi Certified Senior Coach)',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
  },

  players: [
    {
      id: 1,
      name: 'Arun',
      jersey: '#07',
      position: 'Raider',
      status: 'Active-la Irukaru',
      contact: '+91 91234 56789',
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
      attendance: { present: 24, absent: 3, late: 2, percentage: 82 }
    },
    {
      id: 2,
      name: 'Bala',
      jersey: '#03',
      position: 'Defender',
      status: 'Active-la Irukaru',
      contact: '+91 98123 45678',
      photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
      attendance: { present: 26, absent: 2, late: 1, percentage: 90 }
    },
    {
      id: 3,
      name: 'Kumar',
      jersey: '#05',
      position: 'Defender',
      status: 'Active-la Irukaru',
      contact: '+91 97890 12345',
      photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80',
      attendance: { present: 25, absent: 3, late: 1, percentage: 86 }
    },
    {
      id: 4,
      name: 'Karthi',
      jersey: '#10',
      position: 'Raider',
      status: 'Active-la Irukaru',
      contact: '+91 96543 21098',
      photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=80',
      attendance: { present: 28, absent: 1, late: 0, percentage: 96 }
    },
    {
      id: 5,
      name: 'Sanjay',
      jersey: '#09',
      position: 'All-Rounder',
      status: 'Active-la Irukaru',
      contact: '+91 95432 10987',
      photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80',
      attendance: { present: 27, absent: 2, late: 0, percentage: 93 }
    }
  ],

  todayPractice: {
    title: 'Kabaddi Maalai Payirchi',
    date: 'Inaiku — 09 Sep 2026',
    time: 'Maalai 5:00 PM',
    location: 'Home Ground (Namma Ground)',
    sections: [
      { name: 'Warm-up', detail: '15 Mins dynamic stretching matrum leg drills' },
      { name: 'Raid Practice', detail: 'Toe touch & hand touch speed reps' },
      { name: 'Defence Practice', detail: 'Ankle hold & thigh hold grip tactics' },
      { name: 'Fitness Drill', detail: 'High intensity shuttle runs & stamina' },
      { name: 'Team Match Drill', detail: '7v7 match simulation strategy' },
      { name: 'Cool Down', detail: 'Light jogging & foam rolling recovery' }
    ]
  },

  practiceCalendar: [
    {
      id: 1,
      date: '2026-09-09',
      title: 'Maalai Kabaddi Payirchi',
      time: '5:00 PM - 7:00 PM',
      location: 'Home Ground (Mat Court)',
      intensity: 'High Intensity',
      focus: 'Raid Speed & Ankle Hold Grip Tactics',
      drills: '15 Mins warm-up stretching, 30 Mins Toe-touch reps, 30 Mins Ankle hold defense, 30 Mins 7v7 match practice',
      coachNotes: 'Ellaa players-um 4:45 PM kulla kit-oda ground-la irukanum.'
    },
    {
      id: 2,
      date: '2026-09-10',
      title: 'Kaalai Fitness & Stamina',
      time: '6:00 AM - 7:30 AM',
      location: 'Mud Ground (Outdoor Track)',
      intensity: 'Medium',
      focus: '5km Jogging & Core Strength',
      drills: '5km steady pace jogging, 20 Mins core planks & burpees, breathing recovery',
      coachNotes: 'Hydration bottle kandippa eduthutu vaanga.'
    },
    {
      id: 3,
      date: '2026-09-12',
      title: 'Tournament Match Tactical Prep',
      time: '5:00 PM - 7:30 PM',
      location: 'Home Ground (Mat Court)',
      intensity: 'Very High',
      focus: 'Do-or-Die Raid Specialization & Super Tackle',
      drills: 'Do-or-die simulation, 3-man defense chain trapping, bonus point snatch drills',
      coachNotes: 'Practice mudinjavudane video tactical analysis irukku.'
    },
    {
      id: 4,
      date: '2026-09-15',
      title: 'State Championship Pre-Match Drill',
      time: '4:30 PM - 6:30 PM',
      location: 'District Indoor Stadium',
      intensity: 'Competition Ready',
      focus: 'Full Squad Readiness & Official Rules',
      drills: 'Live scrimmage match with referee rules and match-time strategies',
      coachNotes: 'Practice mudinjavudane match jersey distribution nadakkum.'
    }
  ],

  practiceHistory: [
    { date: 'Sep 09', focus: 'Raid & Kaal Aasaivugal', status: 'Mudinthathu' },
    { date: 'Sep 08', focus: 'Defence Ankle Hold Tactics', status: 'Mudinthathu' },
    { date: 'Sep 07', focus: 'Fitness & Stamina Drills', status: 'Mudinthathu' }
  ],

  instructions: [
    {
      id: 101,
      playerId: 1, // Arun
      playerName: 'Arun',
      date: '09 Sep 2026',
      title: 'Toe Touch Practice',
      instruction: 'Inaiku practice-la footwork matrum toe-touch timing nalla focus pannu.',
      priority: 'High Priority',
      status: 'Active'
    },
    {
      id: 102,
      playerId: 2, // Bala
      playerName: 'Bala',
      date: '08 Sep 2026',
      title: 'Ankle Hold Lock',
      instruction: 'Opponent main raider varrappo ankle hold grip strong-aa podu.',
      priority: 'Important',
      status: 'Active'
    }
  ],

  matchNotices: [
    {
      id: 201,
      image: 'assets/match_notice_poster.jpg',
      title: 'Pro Kabaddi Championship Match Day Notice',
      date: 'Saturday, October 26, 2026',
      time: '7:30 PM IST',
      location: 'Home Arena Stadium',
      message: 'Ella players-um 5:30 PM-kulla team jersey kit-oda stadium-ku varanum.',
      status: 'Published'
    }
  ],

  performance: {
    1: { // Arun
      raid: 84, defence: 76, fitness: 88, speed: 90, stamina: 85, skill: 86, discipline: 95,
      starRating: 4,
      notes: 'Raid timing-la semma improvement. Bonus line attempt mattum innum konjam practice pannu.',
      history: [
        { date: 'Sep 08', raid: 84, defence: 76, fitness: 88 }
      ]
    }
  },

  todayAttendance: [
    { playerId: 1, status: 'Present' },
    { playerId: 2, status: 'Absent' },
    { playerId: 3, status: 'Present' },
    { playerId: 4, status: 'Present' },
    { playerId: 5, status: 'Present' }
  ],

  messages: [
    {
      id: 301,
      sender: 'Coach Rajan',
      type: '📢 General Announcement',
      title: 'Match Day Notice Update',
      content: 'Stadium-ku varra time & kit details-a Match Notice section-la check pannikonga.',
      date: '09 Sep 2026 10:30 AM',
      unread: true
    }
  ],

  files: [
    {
      id: 401,
      name: 'Kabaddi_Raid_Tactics_2026.pdf',
      type: 'Document',
      category: 'Tactics & Strategy',
      size: '2.4 MB',
      date: '08 Sep 2026',
      url: 'assets/match_notice_poster.jpg',
      thumbnail: 'assets/match_notice_poster.jpg',
      description: 'Super Raid strategies, Bonus line footwork guidelines and Corner tackle drill manual.'
    },
    {
      id: 402,
      name: 'Toe_Touch_Mastery_Drills.mp4',
      type: 'Video',
      category: 'Practice Video',
      size: '14.8 MB',
      date: '09 Sep 2026',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      thumbnail: 'assets/kabaddi_arena_bg.jpg',
      description: 'Slow motion video analysis of perfect toe touch and sudden frog jump escape from right corner.'
    },
    {
      id: 403,
      name: 'Thaai_Tamizhans_Official_Jersey_2026.png',
      type: 'Image',
      category: 'Jersey & Media',
      size: '1.2 MB',
      date: '09 Sep 2026',
      url: 'assets/thaai_tamizhans_logo.jpg',
      thumbnail: 'assets/thaai_tamizhans_logo.jpg',
      description: 'Official 2026 Gold & Cyber Neon Jersey layout with player numbers and sponsor placements.'
    }
  ],

  notifications: [
    {
      id: 501,
      title: '🎯 புது Instruction: Toe Touch Practice',
      desc: 'Coach Arun-க்கு Toe Touch Practice assign பண்ணியுள்ளார். Footwork & timing focus பண்ணவும்.',
      time: '10 mins munnaadi',
      target: 'player',
      playerId: 1,
      type: 'instruction',
      icon: 'ri-file-list-3-line',
      actionView: 'my-instructions',
      senderRole: 'coach',
      senderName: 'Coach Rajan',
      read: false,
      readByPlayers: []
    },
    {
      id: 502,
      title: '🏆 Pro Kabaddi Championship Match Day Notice',
      desc: 'Coach புதிய போட்டி அறிவிப்பு வெளியிட்டுள்ளார். Saturday 7:30 PM @ Home Arena Stadium.',
      time: '1 hour munnaadi',
      target: 'all',
      type: 'notice',
      icon: 'ri-megaphone-fill',
      actionView: 'match-notices',
      senderRole: 'coach',
      senderName: 'Coach Rajan',
      read: false,
      readByPlayers: []
    },
    {
      id: 503,
      title: '⚡ Today\'s Practice Updated: Kabaddi Maalai Payirchi',
      desc: 'Coach இன்றைய பயிற்சி திட்டத்தை (Maalai 5:00 PM @ Home Ground) update பண்ணியுள்ளார்.',
      time: '2 hours munnaadi',
      target: 'all',
      type: 'practice',
      icon: 'ri-calendar-event-line',
      actionView: 'my-practice',
      senderRole: 'coach',
      senderName: 'Coach Rajan',
      read: false,
      readByPlayers: []
    }
  ],

  liveMatch: {
    teamA: {
      name: 'Thaai Tamizhans (Valayapatti)',
      shortName: 'TTKC',
      score: 0,
      playersOnCourt: 7,
      totalPlayers: 7,
      raidPoints: 0,
      tacklePoints: 0,
      allOutPoints: 0,
      bonusPoints: 0
    },
    teamB: {
      name: 'Madurai Veeran (Melur)',
      shortName: 'OPP',
      score: 0,
      playersOnCourt: 7,
      totalPlayers: 7,
      raidPoints: 0,
      tacklePoints: 0,
      allOutPoints: 0,
      bonusPoints: 0
    },
    currentHalf: '1st Half',
    matchDurationMinutes: 40,
    matchTimeRemaining: 1200,
    isMatchClockRunning: false,
    raidTimeRemaining: 30,
    isRaidRunning: false,
    isDoOrDie: false,
    activeRaidingTeam: 'teamA',
    actionLog: [
      { time: '00:00', text: '🏆 Live Match Scoreboard Ready: Thaai Tamizhans vs Madurai Veeran', type: 'system' }
    ],
    historyStack: []
  },

  scheduledMatches: [
    {
      id: 'match-1',
      matchNumber: 1,
      tournament: 'Sri Mariamman Kovil Panguni Thiruvizha Mabaerum Minnoli Kabaddi Potti',
      village: 'Manapparai (Trichy)',
      round: 'Round 1 (Mudhal Sutru)',
      teamA: 'Thaai Tamizhans (Valayapatti)',
      teamB: 'Madurai Veeran (Melur)',
      date: '2026-09-14',
      time: 'Iravu 08:30 PM',
      venue: 'Amman Kovil Thidal (Semmann Kalam)',
      groundType: 'Semmann Kalam (Red Soil)',
      weightCategory: '65 Kg Weight (Standard)',
      firstPrize: 'Rs.25,000 + Suzhar Koppai 🏆',
      secondPrize: 'Rs.15,000 + Koppai',
      entryFee: 'Rs.500',
      refereeRule: 'Naduvar theerpe iruthiyanathu! Koopidum podhu udane kalam iranga vendum.',
      posterImage: 'assets/match_notice_poster.jpg',
      status: 'Live',
      winner: null,
      scoreA: 0,
      scoreB: 0,
      notes: 'Iravu minnoli velichathil nadakkum anal parakkum mudhal sutru aattam!'
    },
    {
      id: 'match-2',
      matchNumber: 2,
      tournament: 'Muthalamman Chithirai Thiruvizha Akila Indhiya Minnoli Kabaddi Peruvizha',
      village: 'Tenkasi',
      round: 'Quarter-Final (Kaalirudhi)',
      teamA: 'Thaai Tamizhans (Valayapatti)',
      teamB: 'Nellai Siruthaigal (Tenkasi)',
      date: '2026-09-16',
      time: 'Iravu 09:00 PM',
      venue: 'Oor Podhu Kabaddi Thidal (Mann Kalam)',
      groundType: 'Manal & Mann Kalam (Sand)',
      weightCategory: '48 Kg Weight (Sub-Junior)',
      firstPrize: 'Rs.30,000 + Mabaerum Aadu & Koppai 🐐',
      secondPrize: 'Rs.20,000 + Koppai',
      entryFee: 'Rs.1,000',
      refereeRule: 'Naduvarin mudive irudhi • Argument seiya anumadhi illai',
      posterImage: 'assets/match_notice_poster.jpg',
      status: 'Scheduled',
      winner: null,
      scoreA: 0,
      scoreB: 0,
      notes: 'Nellai maavattathin munnani raidergaludan modhum balapareetchai.'
    },
    {
      id: 'match-3',
      matchNumber: 3,
      tournament: 'Gramiya Ilaignar Narpani Mandram Nadathum Mabaerum Kabaddi Thiruvizha',
      village: 'Orathanadu (Thanjavur)',
      round: 'Semi-Final (Araiyirudhi)',
      teamA: 'Thaai Tamizhans (Valayapatti)',
      teamB: 'Thanjavur Puligal (Orathanadu)',
      date: '2026-09-18',
      time: 'Iravu 08:00 PM',
      venue: 'Arasu Palli Maidhanam (Semmann Kalam)',
      groundType: 'Semmann Kalam (Red Soil)',
      weightCategory: 'Open Match (Weight Limit Illai)',
      firstPrize: 'Rs.20,000 + Gear Cycle & Koppai 🚲',
      secondPrize: 'Rs.12,000 + Koppai',
      entryFee: 'Rs.600',
      refereeRule: 'Naduvar theerpe iruthiyanathu • 15-3-15 Mins Match',
      posterImage: 'assets/match_notice_poster.jpg',
      status: 'Scheduled',
      winner: null,
      scoreA: 0,
      scoreB: 0,
      notes: 'Semmann kalathil nadakkum paraparappana araiyirudhi yuththam.'
    },
    {
      id: 'match-4',
      matchNumber: 4,
      tournament: 'Pongal Thirunaal Mabaerum Gramiya Kabaddi Championship 2026',
      village: 'Pollachi (Coimbatore)',
      round: 'Grand Final (Mabaerum Iruthi Potti)',
      teamA: 'Thaai Tamizhans (Valayapatti)',
      teamB: 'Kovai Kombans (Pollachi)',
      date: '2026-09-05',
      time: 'Iravu 10:00 PM',
      venue: 'Oor Maidhanam (Minnoli Semmann Kalam)',
      groundType: 'Semmann Kalam (Red Soil)',
      weightCategory: '55 Kg Weight',
      firstPrize: 'Rs.50,000 + Velli Naanayam & Suzhar Koppai 🏆',
      secondPrize: 'Rs.30,000 + Koppai',
      entryFee: 'Rs.1,000',
      refereeRule: 'Anaithu Kazhaga Vidhimuraigalum Porundhum',
      posterImage: 'assets/match_notice_poster.jpg',
      status: 'Completed',
      winner: 'teamA',
      scoreA: 42,
      scoreB: 35,
      result: 'Thaai Tamizhans 7 Pulligal Vithiyasathil Champion! 🏆',
      notes: 'Oore thirandu paartha mabaerum iruthi potti vetri!'
    }
  ],

  savedMatches: [
    {
      id: 1,
      date: '2026-09-05',
      tournament: 'Pongal Thirunaal Mabaerum Gramiya Kabaddi Championship 2026',
      venue: 'Oor Maidhanam (Minnoli Semmann Kalam), Pollachi',
      teamA: 'Thaai Tamizhans (Valayapatti)',
      teamB: 'Kovai Kombans (Pollachi)',
      scoreA: 42,
      scoreB: 35,
      result: 'Thaai Tamizhans 7 Pulligal Munnilai Vetri! 🏆',
      bestRaider: 'Arun (#07) - 14 Raid Pts',
      bestDefender: 'Bala (#03) - 5 Tackle Pts'
    }
  ]
};

const KABADDI_STORAGE_KEY = 'HOME_KABADDI_APP_DATA_TANGLISH_V2';

function getAppData() {
  let saved = localStorage.getItem(KABADDI_STORAGE_KEY);
  const v1Saved = localStorage.getItem('HOME_KABADDI_APP_DATA_TANGLISH_V1');

  // Check if v1 has newer/more up-to-date data saved
  if (!saved && v1Saved) {
    saved = v1Saved;
  } else if (saved && v1Saved) {
    try {
      const p1 = JSON.parse(v1Saved);
      const p2 = JSON.parse(saved);
      if (p1 && p1._updatedAt && p2 && p2._updatedAt && p1._updatedAt > p2._updatedAt) {
        saved = v1Saved;
      }
    } catch(e) {}
  }

  if (saved) {
    try {
      const parsed = JSON.parse(saved);

      // Ensure required collections exist if missing, without wiping user data!
      if (!parsed.players || !Array.isArray(parsed.players) || parsed.players.length === 0) {
        parsed.players = INITIAL_KABADDI_DATA.players;
      }
      if (!parsed.scheduledMatches || !Array.isArray(parsed.scheduledMatches) || parsed.scheduledMatches.length === 0) {
        parsed.scheduledMatches = INITIAL_KABADDI_DATA.scheduledMatches;
      }
      if (!parsed.practiceCalendar || !Array.isArray(parsed.practiceCalendar) || parsed.practiceCalendar.length === 0) {
        parsed.practiceCalendar = INITIAL_KABADDI_DATA.practiceCalendar;
      }
      if (!parsed.files || !Array.isArray(parsed.files)) {
        parsed.files = INITIAL_KABADDI_DATA.files;
      }
      if (!parsed.notifications || !Array.isArray(parsed.notifications)) {
        parsed.notifications = INITIAL_KABADDI_DATA.notifications;
      }
      if (!parsed.instructions || !Array.isArray(parsed.instructions)) {
        parsed.instructions = INITIAL_KABADDI_DATA.instructions;
      }
      if (!parsed.liveMatch) {
        parsed.liveMatch = JSON.parse(JSON.stringify(INITIAL_KABADDI_DATA.liveMatch));
      }
      if (!parsed.savedMatches || !Array.isArray(parsed.savedMatches)) {
        parsed.savedMatches = INITIAL_KABADDI_DATA.savedMatches;
      }
      if (!parsed.attendance || typeof parsed.attendance !== 'object') {
        parsed.attendance = INITIAL_KABADDI_DATA.attendance;
      }
      if (!parsed.performance || typeof parsed.performance !== 'object') {
        parsed.performance = INITIAL_KABADDI_DATA.performance;
      }

      // Save back to sync both storage keys
      const updatedJson = JSON.stringify(parsed);
      localStorage.setItem(KABADDI_STORAGE_KEY, updatedJson);
      localStorage.setItem('HOME_KABADDI_APP_DATA_TANGLISH_V1', updatedJson);
      return parsed;
    } catch (e) {
      console.error('Error parsing saved app data:', e);
    }
  }

  saveAppData(INITIAL_KABADDI_DATA);
  return INITIAL_KABADDI_DATA;
}

function saveAppData(data) {
  try {
    const clone = JSON.parse(JSON.stringify(data));
    clone._updatedAt = Date.now();
    // Sanitize files array so heavy data URLs / blob URLs do not crash LocalStorage 5MB quota
    if (clone.files && Array.isArray(clone.files)) {
      clone.files = clone.files.map(f => {
        const item = Object.assign({}, f);
        if (item.url && (item.url.startsWith('blob:') || item.url.startsWith('data:video/'))) {
          item.url = '';
        }
        if (item.thumbnail && (item.thumbnail.startsWith('blob:') || item.thumbnail.startsWith('data:video/'))) {
          item.thumbnail = item.type === 'Video' ? 'assets/kabaddi_arena_bg.jpg' : 'assets/thaai_tamizhans_logo.jpg';
        }
        return item;
      });
    }
    const jsonStr = JSON.stringify(clone);
    localStorage.setItem(KABADDI_STORAGE_KEY, jsonStr);
    localStorage.setItem('HOME_KABADDI_APP_DATA_TANGLISH_V1', jsonStr);
  } catch (e) {
    console.warn('LocalStorage quota limit reached, saving lean data:', e);
    try {
      const lean = JSON.parse(JSON.stringify(data));
      lean._updatedAt = Date.now();
      if (lean.files) {
        lean.files = lean.files.map(f => ({
          id: f.id,
          name: f.name,
          type: f.type,
          category: f.category,
          size: f.size,
          date: f.date,
          description: f.description,
          hasIndexedDB: true,
          thumbnail: f.type === 'Video' ? 'assets/kabaddi_arena_bg.jpg' : 'assets/thaai_tamizhans_logo.jpg',
          url: ''
        }));
      }
      const leanStr = JSON.stringify(lean);
      localStorage.setItem(KABADDI_STORAGE_KEY, leanStr);
      localStorage.setItem('HOME_KABADDI_APP_DATA_TANGLISH_V1', leanStr);
    } catch (err) {
      console.error('Critical storage error:', err);
    }
  }
}


