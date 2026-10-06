/**
 * StudyBuddy AI - Monarch Hunter Progression Web Engine
 * Computes RPG Attribute Affinities, Graph Coordinates, and Deterministic Study Power
 * based strictly on authenticated user data and dynamic syllabus topics.
 */

import { HunterUser, Syllabus, SyllabusSubject, SyllabusUnit, SyllabusTopic, TopicStatus } from '../types/hunter';
import { enrichSyllabusWithProgress } from './progressCalculator';

export type AttributeType = 'INT' | 'LOGIC' | 'VITALITY' | 'AGILITY' | 'SENSE' | 'FOCUS';

export interface AttributeAffinity {
  type: AttributeType;
  name: string;
  tagline: string;
  color: string;
  glowColor: string;
  icon: string;
  bonusText: string;
}

export const ATTRIBUTE_DEFINITIONS: Record<AttributeType, AttributeAffinity> = {
  INT: {
    type: 'INT',
    name: 'Intelligence',
    tagline: 'Deep Concept Architecture & Systems',
    color: '#06b6d4', // Cyan
    glowColor: 'rgba(6, 182, 212, 0.6)',
    icon: '🧠',
    bonusText: '+Deep Comprehension & Retention'
  },
  LOGIC: {
    type: 'LOGIC',
    name: 'Logic',
    tagline: 'Algorithmic Problem Solving & Computation',
    color: '#818cf8', // Indigo
    glowColor: 'rgba(129, 140, 248, 0.6)',
    icon: '⚡',
    bonusText: '+Syntax Speed & Reasoning'
  },
  SENSE: {
    type: 'SENSE',
    name: 'Sense',
    tagline: 'Analytical Precision & Error Spotting',
    color: '#f59e0b', // Amber
    glowColor: 'rgba(245, 158, 11, 0.6)',
    icon: '👁️',
    bonusText: '+Intuitive Bug Finding & Math Precision'
  },
  VITALITY: {
    type: 'VITALITY',
    name: 'Vitality',
    tagline: 'Study Endurance & Mental Stamina',
    color: '#10b981', // Emerald
    glowColor: 'rgba(16, 185, 129, 0.6)',
    icon: '🛡️',
    bonusText: '+Fatigue Resistance & Long Sessions'
  },
  AGILITY: {
    type: 'AGILITY',
    name: 'Agility',
    tagline: 'Rapid Recall & Fast Problem Solving',
    color: '#ec4899', // Pink
    glowColor: 'rgba(236, 72, 153, 0.6)',
    icon: '⚔️',
    bonusText: '+Speed Execution in Knowledge Trials'
  },
  FOCUS: {
    type: 'FOCUS',
    name: 'Focus',
    tagline: 'Undivided Mind & Flow Immersion',
    color: '#a855f7', // Purple
    glowColor: 'rgba(168, 85, 247, 0.6)',
    icon: '🔮',
    bonusText: '+Deep Work State & Concentration'
  }
};

/**
 * Determine attribute affinity based on subject name or keywords
 */
export function inferSubjectAttribute(subjectName: string): AttributeAffinity {
  const lower = subjectName.toLowerCase();
  
  if (lower.includes('python') || lower.includes('program') || lower.includes('c++') || lower.includes('java') || lower.includes('code') || lower.includes('algorithm') || lower.includes('dsa') || lower.includes('data structure')) {
    return ATTRIBUTE_DEFINITIONS.LOGIC;
  }
  if (lower.includes('math') || lower.includes('stat') || lower.includes('discrete') || lower.includes('algebra') || lower.includes('calculus') || lower.includes('probab')) {
    return ATTRIBUTE_DEFINITIONS.SENSE;
  }
  if (lower.includes('dbms') || lower.includes('database') || lower.includes('sql') || lower.includes('network') || lower.includes('system') || lower.includes('os') || lower.includes('architecture')) {
    return ATTRIBUTE_DEFINITIONS.INT;
  }
  if (lower.includes('web') || lower.includes('cloud') || lower.includes('devops') || lower.includes('cyber') || lower.includes('security')) {
    return ATTRIBUTE_DEFINITIONS.AGILITY;
  }
  if (lower.includes('english') || lower.includes('human') || lower.includes('manage') || lower.includes('ethic') || lower.includes('design')) {
    return ATTRIBUTE_DEFINITIONS.FOCUS;
  }
  
  // Default to Intelligence
  return ATTRIBUTE_DEFINITIONS.INT;
}

export interface WebGraphNode {
  id: string;
  type: 'core' | 'subject' | 'unit' | 'topic' | 'pillar';
  title: string;
  subtitle?: string;
  level: number;
  mastery: number; // 0-100
  status: TopicStatus | 'CORE' | 'ACTIVE';
  attribute: AttributeAffinity;
  x: number; // SVG coordinates
  y: number;
  radius: number;
  color: string;
  glowColor: string;
  parentId?: string;
  subjectId?: string;
  unitId?: string;
  topicId?: string;
  subjectName?: string;
  unitName?: string;
  stats?: {
    quizzesTaken: number;
    quizzesPassed: number;
    dungeonsCleared: number;
    studyMinutes: number;
    questsCompleted: number;
    lastPracticed?: string;
  };
  bonusPoints: number;
}

export interface WebGraphEdge {
  id: string;
  sourceId: string;
  targetId: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  strength: number; // 0 to 1
  animated: boolean;
}

export interface StudyPowerMetrics {
  studyPower: number;
  overallMastery: number;
  totalTopics: number;
  masteredTopics: number;
  inProgressTopics: number;
  unstartedTopics: number;
  breakdown: {
    levelPower: number;
    xpPower: number;
    statPower: number;
    masteryPower: number;
    combatPower: number;
    streakPower: number;
  };
}

/**
 * Calculates deterministic Study Power and metric breakdown strictly from database values
 */
export function calculateStudyPower(user: HunterUser, syllabus: Syllabus | null): StudyPowerMetrics {
  const enriched = syllabus ? enrichSyllabusWithProgress(syllabus) : null;
  const overallMastery = enriched?.progressPercentage || 0;

  let totalTopics = 0;
  let masteredTopics = 0;
  let inProgressTopics = 0;
  let unstartedTopics = 0;

  if (enriched?.subjects) {
    enriched.subjects.forEach(sub => {
      (sub.units || []).forEach(unit => {
        (unit.topics || []).forEach(top => {
          totalTopics++;
          const pct = top.progress?.progressPercentage || 0;
          if (pct >= 85 || top.progress?.status === 'MASTERED') {
            masteredTopics++;
          } else if (pct > 0 || top.progress?.status === 'IN_PROGRESS') {
            inProgressTopics++;
          } else {
            unstartedTopics++;
          }
        });
      });
    });
  }

  // Base power components
  const levelPower = user.level * 25;
  const xpPower = Math.floor(user.xp / 50);
  const statTotal = (user.stats.strength + user.stats.agility + user.stats.intelligence + user.stats.vitality + user.stats.sense);
  const statPower = statTotal * 2;
  const combatPower = (user.gatesCleared * 12) + (user.totalStudyMinutes > 0 ? Math.floor(user.totalStudyMinutes / 12) : 0);
  const streakPower = user.streakDays * 6;
  
  // Mastery component: scales with actual topic mastery and count
  const masteryPower = totalTopics > 0 
    ? Math.round(overallMastery * 2.5) + (masteredTopics * 12) + (inProgressTopics * 4)
    : Math.min(user.level * 8, 80);

  const totalStudyPower = levelPower + xpPower + statPower + combatPower + streakPower + masteryPower;

  return {
    studyPower: totalStudyPower,
    overallMastery,
    totalTopics,
    masteredTopics,
    inProgressTopics,
    unstartedTopics,
    breakdown: {
      levelPower,
      xpPower,
      statPower,
      masteryPower,
      combatPower,
      streakPower
    }
  };
}

/**
 * Builds the radial graph nodes and edges for SVG Orbital Constellation rendering
 */
export function buildProgressionWebGraph(
  user: HunterUser,
  syllabus: Syllabus | null,
  canvasWidth = 1000,
  canvasHeight = 1000
): {
  nodes: WebGraphNode[];
  edges: WebGraphEdge[];
  metrics: StudyPowerMetrics;
} {
  const metrics = calculateStudyPower(user, syllabus);
  const cx = canvasWidth / 2;
  const cy = canvasHeight / 2;

  const nodes: WebGraphNode[] = [];
  const edges: WebGraphEdge[] = [];

  // 1. Center System Core Node
  const coreNode: WebGraphNode = {
    id: 'core_system',
    type: 'core',
    title: 'SYSTEM CORE',
    subtitle: `${user.currentTitle || 'Shadow Monarch'} · Lv.${user.level}`,
    level: user.level,
    mastery: metrics.overallMastery,
    status: 'CORE',
    attribute: ATTRIBUTE_DEFINITIONS.INT,
    x: cx,
    y: cy,
    radius: 56,
    color: '#06b6d4',
    glowColor: 'rgba(6, 182, 212, 0.8)',
    bonusPoints: 0
  };
  nodes.push(coreNode);

  const enriched = syllabus ? enrichSyllabusWithProgress(syllabus) : null;
  const subjects = enriched?.subjects || [];

  if (subjects.length > 0) {
    // We have dynamic subjects from syllabus!
    const subjectRadius = 240;
    const numSubjects = subjects.length;

    subjects.forEach((subject, subIndex) => {
      const angle = (subIndex / numSubjects) * (2 * Math.PI) - Math.PI / 2;
      const subX = cx + subjectRadius * Math.cos(angle);
      const subY = cy + subjectRadius * Math.sin(angle);
      const attr = inferSubjectAttribute(subject.name);
      const subMastery = subject.progressPercentage || 0;

      const subjectNodeId = `sub_${subject.id}`;
      const subjectNode: WebGraphNode = {
        id: subjectNodeId,
        type: 'subject',
        title: subject.name,
        subtitle: subject.code || `Unit Count: ${(subject.units || []).length}`,
        level: Math.max(1, Math.floor(subMastery / 10)),
        mastery: subMastery,
        status: subMastery >= 85 ? 'MASTERED' : subMastery > 0 ? 'IN_PROGRESS' : 'NOT_STARTED',
        attribute: attr,
        x: subX,
        y: subY,
        radius: 36,
        color: attr.color,
        glowColor: attr.glowColor,
        parentId: 'core_system',
        subjectId: subject.id,
        subjectName: subject.name,
        bonusPoints: Math.round(subMastery / 10)
      };
      nodes.push(subjectNode);

      // Edge from core to subject
      edges.push({
        id: `edge_core_${subjectNodeId}`,
        sourceId: 'core_system',
        targetId: subjectNodeId,
        x1: cx,
        y1: cy,
        x2: subX,
        y2: subY,
        color: attr.color,
        strength: Math.max(0.2, subMastery / 100),
        animated: subMastery > 0
      });

      // Now lay out Units / Topics around this subject in an outward arc
      const units = subject.units || [];
      const allTopicsInSub: SyllabusTopic[] = [];
      units.forEach(u => (u.topics || []).forEach(t => allTopicsInSub.push(t)));

      // Display up to 5 key topics per subject in the radial web to keep it legible and striking
      const displayedTopics = allTopicsInSub.slice(0, 5);
      const topicCount = displayedTopics.length;

      if (topicCount > 0) {
        const topicRadius = 140; // distance from subject node
        const arcSpread = Math.PI * 0.7; // Spread angle
        const startTopicAngle = angle - arcSpread / 2;

        displayedTopics.forEach((topic, tIndex) => {
          const tAngle = topicCount === 1 
            ? angle 
            : startTopicAngle + (tIndex / (topicCount - 1)) * arcSpread;

          const topX = subX + topicRadius * Math.cos(tAngle);
          const topY = subY + topicRadius * Math.sin(tAngle);
          const topProg = topic.progress?.progressPercentage || 0;
          const status = topic.progress?.status || 'NOT_STARTED';

          const topicNodeId = `top_${topic.id}`;
          const topicNode: WebGraphNode = {
            id: topicNodeId,
            type: 'topic',
            title: topic.name,
            subtitle: `${topProg}% Mastery`,
            level: Math.max(1, Math.floor(topProg / 20)),
            mastery: topProg,
            status,
            attribute: attr,
            x: topX,
            y: topY,
            radius: 20,
            color: status === 'MASTERED' ? '#38bdf8' : status === 'IN_PROGRESS' ? '#a855f7' : '#475569',
            glowColor: status === 'MASTERED' ? 'rgba(56, 189, 248, 0.7)' : status === 'IN_PROGRESS' ? 'rgba(168, 85, 247, 0.5)' : 'rgba(71, 85, 105, 0.2)',
            parentId: subjectNodeId,
            subjectId: subject.id,
            subjectName: subject.name,
            topicId: topic.id,
            stats: topic.progress ? {
              quizzesTaken: topic.progress.quizzesTaken || 0,
              quizzesPassed: topic.progress.quizzesPassed || 0,
              dungeonsCleared: topic.progress.dungeonsCleared || 0,
              studyMinutes: topic.progress.studyMinutes || 0,
              questsCompleted: topic.progress.questsCompleted || 0,
              lastPracticed: topic.progress.lastPracticed
            } : undefined,
            bonusPoints: status === 'MASTERED' ? 5 : status === 'IN_PROGRESS' ? 2 : 0
          };
          nodes.push(topicNode);

          edges.push({
            id: `edge_${subjectNodeId}_${topicNodeId}`,
            sourceId: subjectNodeId,
            targetId: topicNodeId,
            x1: subX,
            y1: subY,
            x2: topX,
            y2: topY,
            color: status === 'MASTERED' ? '#38bdf8' : status === 'IN_PROGRESS' ? '#a855f7' : '#334155',
            strength: Math.max(0.15, topProg / 100),
            animated: status === 'IN_PROGRESS' || status === 'MASTERED'
          });
        });
      }
    });
  } else {
    // Fallback innate pillars when no syllabus has been loaded yet
    const innatePillars: {
      id: string;
      title: string;
      subtitle: string;
      attr: AttributeAffinity;
      mastery: number;
      topics: { name: string; mastery: number }[];
    }[] = [
      {
        id: 'pillar_combat',
        title: 'Gate Combat',
        subtitle: 'Dungeon Trials & Boss Fights',
        attr: ATTRIBUTE_DEFINITIONS.VITALITY,
        mastery: Math.min(user.gatesCleared * 20, 100),
        topics: [
          { name: 'Boss Extraction', mastery: Math.min(user.gatesCleared * 25, 100) },
          { name: 'Dungeon Gauntlets', mastery: Math.min(user.gatesCleared * 15, 100) },
          { name: 'Endurance Focus', mastery: Math.min(user.totalStudyMinutes / 2, 100) }
        ]
      },
      {
        id: 'pillar_logic',
        title: 'Cognitive Reasoning',
        subtitle: 'Algorithmic Problem Solving',
        attr: ATTRIBUTE_DEFINITIONS.LOGIC,
        mastery: Math.min(user.level * 10, 80),
        topics: [
          { name: 'Logic Precision', mastery: 30 },
          { name: 'Syntax Flow', mastery: 25 },
          { name: 'Analytical Drill', mastery: 20 }
        ]
      },
      {
        id: 'pillar_discipline',
        title: 'Hunter Discipline',
        subtitle: 'Daily Quests & Focus Routines',
        attr: ATTRIBUTE_DEFINITIONS.FOCUS,
        mastery: Math.min(user.streakDays * 15, 100),
        topics: [
          { name: 'Deep Work Immersion', mastery: Math.min(user.totalStudyMinutes, 100) },
          { name: 'Streak Constancy', mastery: Math.min(user.streakDays * 20, 100) },
          { name: 'Sanctuary Meditation', mastery: 40 }
        ]
      },
      {
        id: 'pillar_recall',
        title: 'Active Recall',
        subtitle: 'Knowledge Retrieval & Quizzes',
        attr: ATTRIBUTE_DEFINITIONS.SENSE,
        mastery: Math.min(user.xp / 100, 75),
        topics: [
          { name: 'Flashcard Mastery', mastery: 35 },
          { name: 'Speed Quizzing', mastery: 45 },
          { name: 'Exam Readiness', mastery: 25 }
        ]
      }
    ];

    const pillarRadius = 240;
    const count = innatePillars.length;

    innatePillars.forEach((p, idx) => {
      const angle = (idx / count) * (2 * Math.PI) - Math.PI / 2;
      const px = cx + pillarRadius * Math.cos(angle);
      const py = cy + pillarRadius * Math.sin(angle);

      const pNode: WebGraphNode = {
        id: p.id,
        type: 'pillar',
        title: p.title,
        subtitle: p.subtitle,
        level: Math.max(1, Math.floor(p.mastery / 15)),
        mastery: p.mastery,
        status: p.mastery >= 85 ? 'MASTERED' : p.mastery > 0 ? 'IN_PROGRESS' : 'NOT_STARTED',
        attribute: p.attr,
        x: px,
        y: py,
        radius: 34,
        color: p.attr.color,
        glowColor: p.attr.glowColor,
        parentId: 'core_system',
        bonusPoints: 3
      };
      nodes.push(pNode);

      edges.push({
        id: `edge_core_${p.id}`,
        sourceId: 'core_system',
        targetId: p.id,
        x1: cx,
        y1: cy,
        x2: px,
        y2: py,
        color: p.attr.color,
        strength: Math.max(0.3, p.mastery / 100),
        animated: p.mastery > 0
      });

      // Add sub-nodes for topics
      p.topics.forEach((top, tIdx) => {
        const topRadius = 130;
        const arcSpread = Math.PI * 0.6;
        const startAngle = angle - arcSpread / 2;
        const tAngle = startAngle + (tIdx / (p.topics.length - 1)) * arcSpread;
        const tx = px + topRadius * Math.cos(tAngle);
        const ty = py + topRadius * Math.sin(tAngle);

        const subId = `${p.id}_top_${tIdx}`;
        nodes.push({
          id: subId,
          type: 'topic',
          title: top.name,
          subtitle: `${top.mastery}% Recall`,
          level: Math.max(1, Math.floor(top.mastery / 20)),
          mastery: top.mastery,
          status: top.mastery >= 85 ? 'MASTERED' : top.mastery > 0 ? 'IN_PROGRESS' : 'NOT_STARTED',
          attribute: p.attr,
          x: tx,
          y: ty,
          radius: 18,
          color: top.mastery >= 85 ? '#38bdf8' : top.mastery > 0 ? '#a855f7' : '#475569',
          glowColor: top.mastery > 0 ? p.attr.glowColor : 'rgba(71,85,105,0.2)',
          parentId: p.id,
          bonusPoints: 1
        });

        edges.push({
          id: `edge_${p.id}_${subId}`,
          sourceId: p.id,
          targetId: subId,
          x1: px,
          y1: py,
          x2: tx,
          y2: ty,
          color: top.mastery > 0 ? p.attr.color : '#334155',
          strength: Math.max(0.2, top.mastery / 100),
          animated: top.mastery > 0
        });
      });
    });
  }

  return { nodes, edges, metrics };
}

/**
 * Creates a rich, realistic sample syllabus (BCA / Computer Science) with realistic starting progress
 * to allow immediate awakening of the Progression Web constellation.
 */
export function createSampleBcaSyllabus(userId: string): Syllabus {
  const now = new Date().toISOString();
  const sylId = `syl_sample_${Date.now()}`;

  const subjects: SyllabusSubject[] = [
    {
      id: `sub_python_${Date.now()}`,
      syllabusId: sylId,
      name: 'Python Programming',
      code: 'BCA-301',
      description: 'Core concepts, data structures, OOP, and algorithm design.',
      color: '#818cf8',
      units: [
        {
          id: `unit_py1_${Date.now()}`,
          subjectId: `sub_python_${Date.now()}`,
          name: 'Unit 1: Fundamentals & Control Flow',
          topics: [
            {
              id: `top_py_var_${Date.now()}`,
              name: 'Variables & Data Types',
              unitId: `unit_py1_${Date.now()}`,
              subjectId: `sub_python_${Date.now()}`,
              progress: {
                topicId: `top_py_var_${Date.now()}`,
                progressPercentage: 85,
                status: 'MASTERED',
                quizzesTaken: 4,
                quizzesPassed: 4,
                dungeonsCleared: 2,
                studyMinutes: 45,
                questsCompleted: 2,
                lastPracticed: now
              }
            },
            {
              id: `top_py_loops_${Date.now()}`,
              name: 'Loops & Conditionals',
              unitId: `unit_py1_${Date.now()}`,
              subjectId: `sub_python_${Date.now()}`,
              progress: {
                topicId: `top_py_loops_${Date.now()}`,
                progressPercentage: 60,
                status: 'IN_PROGRESS',
                quizzesTaken: 2,
                quizzesPassed: 2,
                dungeonsCleared: 1,
                studyMinutes: 30,
                questsCompleted: 1,
                lastPracticed: now
              }
            },
            {
              id: `top_py_funcs_${Date.now()}`,
              name: 'Functions & Recursion',
              unitId: `unit_py1_${Date.now()}`,
              subjectId: `sub_python_${Date.now()}`,
              progress: {
                topicId: `top_py_funcs_${Date.now()}`,
                progressPercentage: 42,
                status: 'IN_PROGRESS',
                quizzesTaken: 1,
                quizzesPassed: 1,
                dungeonsCleared: 0,
                studyMinutes: 20,
                questsCompleted: 1,
                lastPracticed: now
              }
            }
          ]
        },
        {
          id: `unit_py2_${Date.now()}`,
          subjectId: `sub_python_${Date.now()}`,
          name: 'Unit 2: Data Structures & OOP',
          topics: [
            {
              id: `top_py_lists_${Date.now()}`,
              name: 'Lists, Tuples & Dictionaries',
              unitId: `unit_py2_${Date.now()}`,
              subjectId: `sub_python_${Date.now()}`,
              progress: {
                topicId: `top_py_lists_${Date.now()}`,
                progressPercentage: 35,
                status: 'IN_PROGRESS',
                quizzesTaken: 1,
                quizzesPassed: 1,
                dungeonsCleared: 0,
                studyMinutes: 15,
                questsCompleted: 0
              }
            },
            {
              id: `top_py_oop_${Date.now()}`,
              name: 'Classes, Objects & Inheritance',
              unitId: `unit_py2_${Date.now()}`,
              subjectId: `sub_python_${Date.now()}`,
              progress: {
                topicId: `top_py_oop_${Date.now()}`,
                progressPercentage: 0,
                status: 'NOT_STARTED',
                quizzesTaken: 0,
                quizzesPassed: 0,
                dungeonsCleared: 0,
                studyMinutes: 0,
                questsCompleted: 0
              }
            }
          ]
        }
      ]
    },
    {
      id: `sub_dbms_${Date.now()}`,
      syllabusId: sylId,
      name: 'Database Management Systems',
      code: 'BCA-302',
      description: 'Relational data models, SQL queries, normalization, and ACID transactions.',
      color: '#06b6d4',
      units: [
        {
          id: `unit_db1_${Date.now()}`,
          subjectId: `sub_dbms_${Date.now()}`,
          name: 'Unit 1: Relational Architecture',
          topics: [
            {
              id: `top_db_er_${Date.now()}`,
              name: 'ER Diagrams & Relational Model',
              unitId: `unit_db1_${Date.now()}`,
              subjectId: `sub_dbms_${Date.now()}`,
              progress: {
                topicId: `top_db_er_${Date.now()}`,
                progressPercentage: 70,
                status: 'IN_PROGRESS',
                quizzesTaken: 3,
                quizzesPassed: 2,
                dungeonsCleared: 1,
                studyMinutes: 40,
                questsCompleted: 1,
                lastPracticed: now
              }
            },
            {
              id: `top_db_sql_${Date.now()}`,
              name: 'SQL Joins & Aggregations',
              unitId: `unit_db1_${Date.now()}`,
              subjectId: `sub_dbms_${Date.now()}`,
              progress: {
                topicId: `top_db_sql_${Date.now()}`,
                progressPercentage: 55,
                status: 'IN_PROGRESS',
                quizzesTaken: 2,
                quizzesPassed: 2,
                dungeonsCleared: 1,
                studyMinutes: 25,
                questsCompleted: 1,
                lastPracticed: now
              }
            },
            {
              id: `top_db_norm_${Date.now()}`,
              name: 'Normalization (1NF, 2NF, 3NF, BCNF)',
              unitId: `unit_db1_${Date.now()}`,
              subjectId: `sub_dbms_${Date.now()}`,
              progress: {
                topicId: `top_db_norm_${Date.now()}`,
                progressPercentage: 28,
                status: 'IN_PROGRESS',
                quizzesTaken: 1,
                quizzesPassed: 0,
                dungeonsCleared: 0,
                studyMinutes: 15,
                questsCompleted: 0
              }
            }
          ]
        }
      ]
    },
    {
      id: `sub_math_${Date.now()}`,
      syllabusId: sylId,
      name: 'Discrete Mathematics',
      code: 'BCA-303',
      description: 'Set theory, propositional logic, graph theory, and combinatorics.',
      color: '#f59e0b',
      units: [
        {
          id: `unit_math1_${Date.now()}`,
          subjectId: `sub_math_${Date.now()}`,
          name: 'Unit 1: Propositional Logic & Sets',
          topics: [
            {
              id: `top_math_prop_${Date.now()}`,
              name: 'Truth Tables & Logical Equivalence',
              unitId: `unit_math1_${Date.now()}`,
              subjectId: `sub_math_${Date.now()}`,
              progress: {
                topicId: `top_math_prop_${Date.now()}`,
                progressPercentage: 65,
                status: 'IN_PROGRESS',
                quizzesTaken: 2,
                quizzesPassed: 2,
                dungeonsCleared: 1,
                studyMinutes: 35,
                questsCompleted: 1
              }
            },
            {
              id: `top_math_graph_${Date.now()}`,
              name: 'Graph Theory & Trees',
              unitId: `unit_math1_${Date.now()}`,
              subjectId: `sub_math_${Date.now()}`,
              progress: {
                topicId: `top_math_graph_${Date.now()}`,
                progressPercentage: 19,
                status: 'IN_PROGRESS',
                quizzesTaken: 1,
                quizzesPassed: 0,
                dungeonsCleared: 0,
                studyMinutes: 10,
                questsCompleted: 0
              }
            }
          ]
        }
      ]
    },
    {
      id: `sub_net_${Date.now()}`,
      syllabusId: sylId,
      name: 'Computer Networks',
      code: 'BCA-304',
      description: 'OSI Model, TCP/IP, Routing Algorithms, and Network Security.',
      color: '#10b981',
      units: [
        {
          id: `unit_net1_${Date.now()}`,
          subjectId: `sub_net_${Date.now()}`,
          name: 'Unit 1: Network Layers & Protocols',
          topics: [
            {
              id: `top_net_osi_${Date.now()}`,
              name: 'OSI 7-Layer Architecture',
              unitId: `unit_net1_${Date.now()}`,
              subjectId: `sub_net_${Date.now()}`,
              progress: {
                topicId: `top_net_osi_${Date.now()}`,
                progressPercentage: 45,
                status: 'IN_PROGRESS',
                quizzesTaken: 1,
                quizzesPassed: 1,
                dungeonsCleared: 1,
                studyMinutes: 20,
                questsCompleted: 0
              }
            },
            {
              id: `top_net_tcp_${Date.now()}`,
              name: 'TCP 3-Way Handshake & IP Addressing',
              unitId: `unit_net1_${Date.now()}`,
              subjectId: `sub_net_${Date.now()}`,
              progress: {
                topicId: `top_net_tcp_${Date.now()}`,
                progressPercentage: 10,
                status: 'NOT_STARTED',
                quizzesTaken: 0,
                quizzesPassed: 0,
                dungeonsCleared: 0,
                studyMinutes: 5,
                questsCompleted: 0
              }
            }
          ]
        }
      ]
    }
  ];

  return {
    id: sylId,
    userId,
    program: 'BCA (Bachelor of Computer Applications)',
    semester: 'Semester 3',
    institution: 'Department of Computer Science',
    isActive: true,
    createdAt: now,
    updatedAt: now,
    subjects
  };
}

