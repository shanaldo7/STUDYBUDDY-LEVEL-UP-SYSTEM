/**
 * Centralized StudyBuddy Progress Engine
 * Calculates Topic, Unit, Subject, and Syllabus Progress deterministically from real student activity.
 */

import { Syllabus, SyllabusSubject, SyllabusUnit, SyllabusTopic, TopicProgress, TopicStatus } from '../types/hunter';

/**
 * Calculates deterministic topic progress (0-100%) and status based on real evidence:
 * - Quiz completions & pass rate: up to 40%
 * - Dungeon battles cleared: up to 30%
 * - Quests completed for topic: up to 20%
 * - Focused study time (Pomodoro minutes): up to 10%
 */
export function calculateTopicProgressFromStats(stats: {
  quizzesTaken?: number;
  quizzesPassed?: number;
  dungeonsCleared?: number;
  questsCompleted?: number;
  studyMinutes?: number;
}): { progressPercentage: number; status: TopicStatus } {
  const quizzesTaken = stats.quizzesTaken || 0;
  const quizzesPassed = stats.quizzesPassed || 0;
  const dungeonsCleared = stats.dungeonsCleared || 0;
  const questsCompleted = stats.questsCompleted || 0;
  const studyMinutes = stats.studyMinutes || 0;

  if (quizzesTaken === 0 && dungeonsCleared === 0 && questsCompleted === 0 && studyMinutes === 0) {
    return { progressPercentage: 0, status: 'NOT_STARTED' };
  }

  // 1. Quiz Score Component (max 40 pts)
  let quizScore = 0;
  if (quizzesTaken > 0) {
    const passRate = quizzesPassed / quizzesTaken;
    const volumeBonus = Math.min(quizzesTaken / 3, 1.0); // full volume at 3+ quizzes
    quizScore = (passRate * 30) + (volumeBonus * 10);
  }

  // 2. Dungeon Clear Component (max 30 pts)
  // 1 clear = 18 pts, 2 clears = 26 pts, 3+ clears = 30 pts
  const dungeonScore = Math.min(dungeonsCleared * 15, 30);

  // 3. Quest Component (max 20 pts)
  const questScore = Math.min(questsCompleted * 10, 20);

  // 4. Focus Study Time Component (max 10 pts, 25 mins = 5 pts, 50+ mins = 10 pts)
  const focusScore = Math.min((studyMinutes / 50) * 10, 10);

  const rawTotal = Math.round(quizScore + dungeonScore + questScore + focusScore);
  const progressPercentage = Math.min(Math.max(rawTotal, 0), 100);

  let status: TopicStatus = 'NOT_STARTED';
  if (progressPercentage >= 85) {
    status = 'MASTERED';
  } else if (progressPercentage >= 15) {
    status = 'IN_PROGRESS';
  }

  return { progressPercentage, status };
}

/**
 * Enriches a topic with calculated progress
 */
export function enrichTopic(topic: SyllabusTopic): SyllabusTopic {
  const currentProg = topic.progress || {
    topicId: topic.id,
    progressPercentage: 0,
    status: 'NOT_STARTED',
    quizzesTaken: 0,
    quizzesPassed: 0,
    dungeonsCleared: 0,
    studyMinutes: 0,
    questsCompleted: 0
  };

  const calculated = calculateTopicProgressFromStats(currentProg);
  return {
    ...topic,
    progress: {
      ...currentProg,
      progressPercentage: calculated.progressPercentage,
      status: calculated.status
    }
  };
}

/**
 * Enriches an entire syllabus hierarchy with aggregated progress:
 * Topic -> Unit -> Subject -> Syllabus
 */
export function enrichSyllabusWithProgress(syllabus: Syllabus): Syllabus {
  let totalSubjectProgress = 0;
  let totalSubjects = 0;

  const subjects = (syllabus.subjects || []).map(subject => {
    let totalUnitProgress = 0;
    let totalUnits = 0;

    const units = (subject.units || []).map(unit => {
      let totalTopicProgress = 0;
      const topics = (unit.topics || []).map(t => enrichTopic(t));

      if (topics.length > 0) {
        totalTopicProgress = topics.reduce((acc, t) => acc + (t.progress?.progressPercentage || 0), 0);
        const unitProgress = Math.round(totalTopicProgress / topics.length);
        totalUnitProgress += unitProgress;
        totalUnits++;
        return {
          ...unit,
          topics,
          progressPercentage: unitProgress
        };
      }

      totalUnits++;
      return {
        ...unit,
        topics: [],
        progressPercentage: 0
      };
    });

    const subjectProgress = totalUnits > 0 ? Math.round(totalUnitProgress / totalUnits) : 0;
    totalSubjectProgress += subjectProgress;
    totalSubjects++;

    return {
      ...subject,
      units,
      progressPercentage: subjectProgress
    };
  });

  const overallProgress = totalSubjects > 0 ? Math.round(totalSubjectProgress / totalSubjects) : 0;

  return {
    ...syllabus,
    subjects,
    progressPercentage: overallProgress
  };
}

export interface WeakTopicItem {
  subjectId: string;
  subjectName: string;
  unitId: string;
  unitName: string;
  topicId: string;
  topicName: string;
  progressPercentage: number;
  status: TopicStatus;
}

/**
 * Finds the weakest topics across the active syllabus (progress < 60%)
 * Sorted from lowest progress to highest
 */
export function getWeakTopics(syllabus: Syllabus | null): WeakTopicItem[] {
  if (!syllabus || !syllabus.subjects) return [];

  const items: WeakTopicItem[] = [];

  syllabus.subjects.forEach(subject => {
    (subject.units || []).forEach(unit => {
      (unit.topics || []).forEach(topic => {
        const progress = topic.progress?.progressPercentage || 0;
        const status = topic.progress?.status || 'NOT_STARTED';
        items.push({
          subjectId: subject.id,
          subjectName: subject.name,
          unitId: unit.id,
          unitName: unit.name,
          topicId: topic.id,
          topicName: topic.name,
          progressPercentage: progress,
          status
        });
      });
    });
  });

  // Sort lowest progress first
  return items.sort((a, b) => a.progressPercentage - b.progressPercentage);
}
