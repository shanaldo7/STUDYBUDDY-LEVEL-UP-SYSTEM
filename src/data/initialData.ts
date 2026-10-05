import { HunterUser, DailyQuest, DungeonGate, Boss, QuizQuestion, ShadowSoldier, SkillNode, Flashcard, ExamMilestone } from '../types/hunter';

export const initialUser: HunterUser = {
  id: 'usr_monarch_01',
  username: 'sung_jin_study',
  hunterName: 'Sung Jin-Study',
  hunterClass: 'Shadow Sovereign',
  hunterRank: 'B',
  level: 24,
  xp: 3850,
  xpNext: 5000,
  mana: 180,
  maxMana: 200,
  statPoints: 6,
  stats: {
    strength: 45,     // Grit & Work Ethic
    agility: 38,      // Speed & Fast Calculation
    intelligence: 72, // Concept Mastery & Deep Theory
    vitality: 40,     // Study Endurance
    sense: 50         // Intuition & Analysis
  },
  currentTitle: 'Monarch of Knowledge',
  streakDays: 7,
  lastActiveDate: new Date().toISOString(),
  gold: 1450,
  totalStudyMinutes: 1840,
  gatesCleared: 34
};

export const initialDailyQuests: DailyQuest[] = [
  {
    id: 'quest_1',
    title: 'Cognitive Conditioning',
    description: 'Complete 50 minutes of deep focus study sessions.',
    current: 35,
    target: 50,
    rewardXp: 350,
    rewardPoints: 2,
    completed: false,
    claimed: false,
    icon: 'Brain'
  },
  {
    id: 'quest_2',
    title: 'Dungeon Gate Breach',
    description: 'Conquer 2 Dungeon Gate study expeditions.',
    current: 1,
    target: 2,
    rewardXp: 400,
    rewardPoints: 2,
    completed: false,
    claimed: false,
    icon: 'Swords'
  },
  {
    id: 'quest_3',
    title: 'Active Recall Drill',
    description: 'Review at least 10 flashcards in the Revision Lab.',
    current: 10,
    target: 10,
    rewardXp: 300,
    rewardPoints: 1,
    completed: true,
    claimed: false,
    icon: 'Repeat'
  },
  {
    id: 'quest_4',
    title: 'Monarch Boss Challenge',
    description: 'Inflict at least 2,000 damage on a Raid Boss Trial.',
    current: 0,
    target: 2000,
    rewardXp: 600,
    rewardPoints: 3,
    completed: false,
    claimed: false,
    icon: 'Crown'
  }
];

export const initialGates: DungeonGate[] = [
  {
    id: 'gate_e',
    name: 'Goblin Archives Cave',
    rank: 'E',
    subject: 'Computer Science & Logic',
    description: 'Swarming with syntax goblins that punish fundamental errors.',
    monsterName: 'Hobgoblin Archivist',
    monsterHp: 800,
    maxHp: 800,
    monsterType: 'Beast',
    rewardXp: 300,
    rewardGold: 120,
    color: 'from-slate-800 to-emerald-950'
  },
  {
    id: 'gate_d',
    name: 'Crypt of Derivatives',
    rank: 'D',
    subject: 'Calculus & Linear Algebra',
    description: 'Haunted crypt where spectral integrals drain unshielded mana.',
    monsterName: 'Spectral Integral Wight',
    monsterHp: 1400,
    maxHp: 1400,
    monsterType: 'Undead',
    rewardXp: 550,
    rewardGold: 240,
    color: 'from-slate-800 to-cyan-950'
  },
  {
    id: 'gate_c',
    name: 'Algorithm Citadel',
    rank: 'C',
    subject: 'Data Structures & Algorithms',
    description: 'Obsidian fortress guarded by high-complexity sorting sentinels.',
    monsterName: 'Obsidian Sorting Sentinel',
    monsterHp: 2200,
    maxHp: 2200,
    monsterType: 'Construct',
    rewardXp: 850,
    rewardGold: 400,
    color: 'from-slate-800 to-blue-950'
  },
  {
    id: 'gate_b',
    name: 'Quantum Resonance Spire',
    rank: 'B',
    subject: 'Physics & Thermodynamics',
    description: 'Unstable dimensional rift where wavefunctions collapse under trial.',
    monsterName: 'Quantum Flux Chimera',
    monsterHp: 3400,
    maxHp: 3400,
    monsterType: 'Arcane',
    rewardXp: 1300,
    rewardGold: 650,
    color: 'from-slate-800 to-indigo-950'
  },
  {
    id: 'gate_a',
    name: 'Neural Void Monolith',
    rank: 'A',
    subject: 'Machine Learning & Neuroscience',
    description: 'Deep abyss of gradient backpropagation and cognitive architectures.',
    monsterName: 'Void Synapse Behemoth',
    monsterHp: 4800,
    maxHp: 4800,
    monsterType: 'Monarch Beast',
    rewardXp: 2100,
    rewardGold: 1100,
    color: 'from-slate-800 to-purple-950'
  },
  {
    id: 'gate_s',
    name: "Monarch's Red Gate",
    rank: 'S',
    subject: 'Full-Stack Distributed Systems',
    description: 'Catastrophic double-dungeon where only awakened sovereigns survive.',
    monsterName: 'Ancient High Orc Shaman',
    monsterHp: 7500,
    maxHp: 7500,
    monsterType: 'Monarch Commander',
    rewardXp: 3800,
    rewardGold: 2200,
    color: 'from-slate-800 to-red-950'
  }
];

export const initialBosses: Boss[] = [
  {
    id: 'boss_igris',
    name: 'Igris the Bloodred Knight',
    title: 'Commander of the Red Throne',
    rank: 'S',
    hp: 6000,
    maxHp: 6000,
    specialty: 'High-Speed Algorithms & Time Complexity',
    lore: 'An ancient knight clad in crimson armor who guarded the empty monarch throne for centuries. Requires flawless algorithmic reasoning to defeat.',
    phases: 2,
    extractableShadow: {
      name: 'Igris the Bloodred Knight',
      grade: 'Marshal',
      type: 'Knight Vanguard',
      power: 750
    }
  },
  {
    id: 'boss_architect',
    name: 'Architect of the System',
    title: 'Keeper of the Double Dungeon',
    rank: 'S+',
    hp: 9500,
    maxHp: 9500,
    specialty: 'Discrete Mathematics, Proofs & Set Theory',
    lore: 'The creator of the Hunter awakening protocol. Strikes with merciless geometric statues and logical paradoxes.',
    phases: 3,
    extractableShadow: {
      name: 'Grand Architect Simulacrum',
      grade: 'Grand Marshal',
      type: 'Arcane Construct',
      power: 1200
    }
  },
  {
    id: 'boss_silad',
    name: 'Frost Monarch Silad',
    title: 'Sovereign of the Absolute Zero',
    rank: 'S',
    hp: 8200,
    maxHp: 8200,
    specialty: 'Thermodynamics & Classical Field Physics',
    lore: 'Commands blizzard tempests that freeze mental processing. Defeating him requires understanding entropy, heat transfer, and wave mechanics.',
    phases: 2,
    extractableShadow: {
      name: 'Glacial Ice Golem',
      grade: 'Elite Knight',
      type: 'Elemental Beast',
      power: 850
    }
  },
  {
    id: 'boss_kamish',
    name: 'Shadow Dragon Kamish',
    title: 'Cataclysm of the Burning Heavens',
    rank: 'S+',
    hp: 14000,
    maxHp: 14000,
    specialty: 'Distributed Scalability, Concurrency & High Availability',
    lore: 'The legendary dragon whose roar devastated entire hunter guilds. Demands mastery over Paxos, Raft consensus, CAP theorem, and partition tolerance.',
    phases: 3,
    extractableShadow: {
      name: 'Kamish Shadow Dragon Wyrm',
      grade: 'Grand Marshal',
      type: 'Dragon Wyrm',
      power: 1800
    }
  }
];

export const initialQuestions: QuizQuestion[] = [
  {
    id: 'q_1',
    subject: 'Computer Science & Logic',
    question: 'What is the tight worst-case time complexity of looking up a key in a standard balanced AVL Tree?',
    options: ['O(1)', 'O(log N)', 'O(N)', 'O(N log N)'],
    correctIndex: 1,
    explanation: 'An AVL tree is strictly height-balanced with balance factor in {-1, 0, 1}. The height is strictly bounded by ~1.44 log2(N), guaranteeing O(log N) lookup in all cases.',
    difficulty: 'C'
  },
  {
    id: 'q_2',
    subject: 'Computer Science & Logic',
    question: 'In graph theory, which algorithm computes Single-Source Shortest Paths in graphs that may contain negative edge weights (assuming no negative cycles)?',
    options: ["Dijkstra's Algorithm", "Bellman-Ford Algorithm", "Kruskal's Algorithm", "Floyd-Warshall Algorithm"],
    correctIndex: 1,
    explanation: 'Bellman-Ford relaxes all edges |V| - 1 times and safely detects negative weight cycles in O(V * E) time, unlike standard greedy Dijkstra.',
    difficulty: 'B'
  },
  {
    id: 'q_3',
    subject: 'Calculus & Linear Algebra',
    question: 'If a square matrix A has an eigenvalue lambda = 0, what does this guarantee about matrix A?',
    options: ['Matrix A is symmetric', 'Matrix A is singular (det(A) = 0)', 'Matrix A is positive definite', 'Matrix A is orthogonal'],
    correctIndex: 1,
    explanation: 'The determinant is the product of all eigenvalues. If any eigenvalue is 0, det(A) = 0, meaning the matrix is non-invertible (singular).',
    difficulty: 'C'
  },
  {
    id: 'q_4',
    subject: 'Physics & Thermodynamics',
    question: 'According to the Second Law of Thermodynamics, in any spontaneous process within an isolated system, the total entropy of the system:',
    options: ['Must always decrease', 'Always remains strictly zero', 'Can never decrease (delta S >= 0)', 'Fluctuates sinusoidally with temperature'],
    correctIndex: 2,
    explanation: 'Clausius and Kelvin-Planck formulations dictate that the entropy of an isolated system never decreases over time; it increases for irreversible processes and stays constant for reversible ones.',
    difficulty: 'D'
  },
  {
    id: 'q_5',
    subject: 'Machine Learning & Neuroscience',
    question: 'Which vanishing/exploding gradient mitigation technique normalizes activations per mini-batch across spatial dimensions?',
    options: ['Dropout Layer', 'Batch Normalization', 'Max Pooling', 'Softmax Activation'],
    correctIndex: 1,
    explanation: 'Batch Normalization computes mean and variance over the batch for each feature channel, stabilizing internal covariate shift and smoothing optimization loss landscapes.',
    difficulty: 'B'
  },
  {
    id: 'q_6',
    subject: 'Full-Stack Distributed Systems',
    question: 'Under Eric Brewer\'s CAP theorem, in the presence of a network partition (P), a distributed system MUST choose between:',
    options: ['Consistency (C) and Availability (A)', 'Latency and Throughput', 'Security and Persistence', 'ACID and BASE'],
    correctIndex: 0,
    explanation: 'Because network partitions cannot be avoided in real distributed networks, a partition requires choosing either ensuring every read receives the most recent write (Consistency) or guaranteeing non-error responses (Availability).',
    difficulty: 'A'
  },
  {
    id: 'q_7',
    subject: 'Computer Science & Logic',
    question: 'What is the space complexity of an in-place QuickSort implementation when using tail recursion optimization?',
    options: ['O(1)', 'O(log N)', 'O(N)', 'O(N^2)'],
    correctIndex: 1,
    explanation: 'By recursing on the smaller partition first and using tail recursion for the larger, maximum call stack depth is constrained to O(log N).',
    difficulty: 'B'
  },
  {
    id: 'q_8',
    subject: 'Calculus & Linear Algebra',
    question: 'What is the gradient vector of a scalar function f(x, y, z) geometrically perpendicular (normal) to?',
    options: ['The line of steepest descent', 'The level surfaces of f(x, y, z) = c', 'The tangent vector along gradient flow', 'The curvature vector'],
    correctIndex: 1,
    explanation: 'The gradient vector points in the direction of greatest rate of increase and is orthogonal to level surfaces/contour curves of constant potential.',
    difficulty: 'C'
  }
];

export const initialShadows: ShadowSoldier[] = [
  {
    id: 'shadow_igris',
    name: 'Igris the Bloodred Knight',
    grade: 'Marshal',
    type: 'Knight Vanguard',
    powerBonus: 750,
    extractedFrom: 'Red Throne Monarch Trial',
    perkDescription: '+25% XP bonus in Algorithm & Logic Dungeon Raids',
    unlockedAt: '2026-09-12'
  },
  {
    id: 'shadow_tank',
    name: 'Tank the Frost Bear',
    grade: 'Elite Knight',
    type: 'Beast Vanguard',
    powerBonus: 480,
    extractedFrom: 'Glacial Core Abyss',
    perkDescription: 'Absorbs first wrong answer penalty per dungeon encounter',
    unlockedAt: '2026-09-18'
  },
  {
    id: 'shadow_iron',
    name: 'Iron the Colossus',
    grade: 'Knight',
    type: 'Heavy Infantry',
    powerBonus: 390,
    extractedFrom: 'Demon Castle Ramparts',
    perkDescription: '+15% Mana pool during Focus Room pomodoro sessions',
    unlockedAt: '2026-09-24'
  }
];

export const initialSkills: SkillNode[] = [
  // Shadow Branch
  {
    id: 'sk_arise',
    name: 'Shadow Extraction (ARISE)',
    branch: 'Shadow',
    description: 'Extract fallen boss consciousness into eternal study shadow soldiers.',
    cost: 3,
    unlocked: true,
    level: 2,
    maxLevel: 3,
    icon: 'Ghost'
  },
  {
    id: 'sk_monarch_domain',
    name: "Monarch's Domain",
    branch: 'Shadow',
    description: 'Increases all summoned shadow soldiers power buffs by 50%.',
    cost: 4,
    unlocked: false,
    level: 0,
    maxLevel: 3,
    icon: 'Crown',
    dependsOn: 'sk_arise'
  },
  // Cognitive Branch
  {
    id: 'sk_deep_flow',
    name: 'Flow State Overdrive',
    branch: 'Cognitive',
    description: 'Boosts Pomodoro study efficiency by 30% for 60 minutes.',
    cost: 2,
    unlocked: true,
    level: 1,
    maxLevel: 3,
    icon: 'Sparkles'
  },
  {
    id: 'sk_photographic',
    name: 'Photographic Recall',
    branch: 'Cognitive',
    description: 'Halves the memory decay rate in Spaced Repetition flashcards.',
    cost: 3,
    unlocked: true,
    level: 1,
    maxLevel: 3,
    icon: 'Eye',
    dependsOn: 'sk_deep_flow'
  },
  // Battle Branch
  {
    id: 'sk_mana_shield',
    name: 'Cognitive Mana Shield',
    branch: 'Battle',
    description: 'Absorbs lethal damage from incorrect dungeon quiz answers.',
    cost: 2,
    unlocked: true,
    level: 1,
    maxLevel: 2,
    icon: 'Shield'
  },
  {
    id: 'sk_crit_strike',
    name: 'Critical Concept Surge',
    branch: 'Battle',
    description: '25% chance to deal 3x damage to dungeon monsters on correct answer.',
    cost: 4,
    unlocked: false,
    level: 0,
    maxLevel: 3,
    icon: 'Zap',
    dependsOn: 'sk_mana_shield'
  }
];

export const initialFlashcards: Flashcard[] = [
  {
    id: 'fc_1',
    subject: 'Computer Science',
    question: 'What is the time complexity of QuickSelect average case vs worst case?',
    answer: 'Average case: O(N) linear time. Worst case: O(N^2) if poor pivot selections occur (e.g. sorted array without random/median-of-three pivot).',
    difficulty: 3,
    nextReview: 'Today',
    reviewsCount: 4
  },
  {
    id: 'fc_2',
    subject: 'Mathematics',
    question: 'State the derivative of arcsin(x) with respect to x.',
    answer: 'd/dx [arcsin(x)] = 1 / sqrt(1 - x^2) for -1 < x < 1.',
    difficulty: 2,
    nextReview: 'Today',
    reviewsCount: 3
  },
  {
    id: 'fc_3',
    subject: 'Physics',
    question: "What is Snell's Law governing refraction of waves across boundaries?",
    answer: 'n1 * sin(theta1) = n2 * sin(theta2), where n is the refractive index and theta is the angle from normal.',
    difficulty: 1,
    nextReview: 'In 3 days',
    reviewsCount: 5
  },
  {
    id: 'fc_4',
    subject: 'Distributed Systems',
    question: 'What is the Raft consensus leader election timeout typically configured to?',
    answer: 'Between 150ms and 300ms, randomized to prevent split vote scenarios among candidates.',
    difficulty: 4,
    nextReview: 'Today',
    reviewsCount: 2
  }
];

export const initialExams: ExamMilestone[] = [
  {
    id: 'ex_1',
    title: 'Advanced Algorithms & System Design Final',
    subject: 'Computer Science',
    date: '2026-11-18',
    targetScore: 95,
    syllabusProgress: 72,
    notes: 'Prioritize distributed consensus, dynamic programming, and network protocols.',
    topics: [
      { name: 'Dynamic Programming & Memoization', completed: true },
      { name: 'Graph Theory & Network Flow', completed: true },
      { name: 'Distributed Consensus (Raft/Paxos)', completed: false },
      { name: 'Cache Invalidation & CDN Design', completed: false }
    ]
  },
  {
    id: 'ex_2',
    title: 'Multivariable Calculus & Differential Equations',
    subject: 'Mathematics',
    date: '2026-12-05',
    targetScore: 90,
    syllabusProgress: 60,
    notes: "Review Green's, Stokes', and Divergence theorems with vector fields.",
    topics: [
      { name: 'Partial Derivatives & Chain Rule', completed: true },
      { name: 'Multiple Integrals (Polar/Spherical)', completed: true },
      { name: "Vector Calculus & Stokes' Theorem", completed: false }
    ]
  }
];
