/**
 * StudyBuddy AI - Syllabus Analysis & Dynamic Content Generator
 * Analyzes syllabus text/PDFs, structures learning trees, and generates tailored quizzes/study plans.
 */

import { AIProviderConfig, QuizQuestion } from '../types/hunter';
import { callGeminiREST } from './gemini';

export interface RawParsedSyllabus {
  program: string;
  semester: string;
  institution?: string;
  subjects: {
    name: string;
    code?: string;
    description?: string;
    units: {
      name: string;
      topics: string[];
    }[];
  }[];
}

/**
 * Robust local fallback parser when AI is unavailable or produces unparseable JSON.
 * Identifies subjects, units/modules, and bulleted/numbered topics.
 */
export function parseSyllabusLocally(text: string, defaultProgram = 'General Studies', defaultSemester = 'Semester 1'): RawParsedSyllabus {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  
  let program = defaultProgram;
  let semester = defaultSemester;
  let institution = '';
  
  // Extract potential header information
  for (let i = 0; i < Math.min(lines.length, 6); i++) {
    const line = lines[i];
    if (/semester|sem|term|year/i.test(line) && !semester) {
      semester = line;
    }
    if (/bca|b\.?tech|bsc|mca|bba|mba|class\s+\d+|grade\s+\d+/i.test(line) && program === 'General Studies') {
      program = line;
    }
    if (/university|college|institute|school|academy/i.test(line) && !institution) {
      institution = line;
    }
  }

  const subjects: RawParsedSyllabus['subjects'] = [];
  let currentSubject: RawParsedSyllabus['subjects'][0] | null = null;
  let currentUnit: { name: string; topics: string[] } | null = null;

  for (const line of lines) {
    // Check if line is a subject header (e.g. "Subject 1: Python Programming", "Course: DBMS", or standalone capitalized title)
    const isSubjectHeader = /^(subject|course|paper|module\s+group)\s*\d*[:\-]\s*(.+)$/i.test(line) ||
      (/^[A-Z][A-Za-z0-9\s,&:\-]{3,50}$/.test(line) && !line.startsWith('-') && !line.startsWith('*') && !/^(unit|chapter|module)\s*\d+/i.test(line) && line.length < 45 && !currentSubject);

    const isUnitHeader = /^(unit|module|chapter|section|part)\s*\d*[:\-]?\s*(.+)$/i.test(line) ||
      /^unit\s+\d+/i.test(line);

    const isTopicLine = /^[-*•\d+\.]\s*(.+)$/.test(line) || (/^[a-z0-9]/i.test(line) && line.length < 80);

    if (isSubjectHeader && !isUnitHeader && !line.startsWith('-') && !line.startsWith('•')) {
      const name = line.replace(/^(subject|course|paper)\s*\d*[:\-]\s*/i, '').trim();
      if (name.length > 2) {
        currentSubject = {
          name,
          description: `Core subject in ${program}`,
          units: []
        };
        subjects.push(currentSubject);
        currentUnit = null;
        continue;
      }
    }

    if (isUnitHeader) {
      if (!currentSubject) {
        currentSubject = {
          name: program !== 'General Studies' ? `${program} Core` : 'Core Subject',
          units: []
        };
        subjects.push(currentSubject);
      }
      currentUnit = {
        name: line,
        topics: []
      };
      currentSubject.units.push(currentUnit);
      continue;
    }

    if (currentSubject) {
      if (!currentUnit) {
        currentUnit = {
          name: 'Unit 1: Fundamentals',
          topics: []
        };
        currentSubject.units.push(currentUnit);
      }

      if (isTopicLine && currentUnit) {
        const cleanTopic = line.replace(/^[-*•\d+\.]\s*/, '').trim();
        if (cleanTopic.length > 1 && !cleanTopic.toLowerCase().includes('syllabus') && cleanTopic.length < 120) {
          // Split multiple comma-separated topics if present
          if (cleanTopic.includes(',') && cleanTopic.length > 20) {
            const parts = cleanTopic.split(',').map(p => p.trim()).filter(p => p.length > 1);
            currentUnit.topics.push(...parts);
          } else {
            currentUnit.topics.push(cleanTopic);
          }
        }
      }
    }
  }

  // If no subjects were parsed, create a default container with the text
  if (subjects.length === 0) {
    subjects.push({
      name: program !== 'General Studies' ? program : 'General Curriculum',
      units: [
        {
          name: 'Unit 1: Main Topics',
          topics: lines
            .filter(l => l.length > 2 && l.length < 80 && !l.startsWith('=='))
            .slice(0, 10)
            .map(l => l.replace(/^[-*•\d+\.]\s*/, '').trim())
        }
      ]
    });
  }

  return {
    program,
    semester,
    institution: institution || undefined,
    subjects
  };
}

/**
 * Analyzes raw syllabus text using configured AI provider with strict JSON output.
 */
export async function analyzeSyllabusWithAI(
  syllabusText: string,
  hints?: { program?: string; semester?: string; institution?: string },
  config?: AIProviderConfig
): Promise<RawParsedSyllabus> {
  const defaultProgram = hints?.program?.trim() || 'Academic Curriculum';
  const defaultSemester = hints?.semester?.trim() || 'Semester 1';
  const institutionHint = hints?.institution?.trim() || '';

  const prompt = `You are the Tactical Monarch Hunter Syllabus Deconstructor.
Analyze the following university/school/college course syllabus text and extract a pristine, complete, structured hierarchy of subjects, units/modules, and topics.

STUDENT HINTS:
- Program/Course: ${defaultProgram}
- Semester/Term: ${defaultSemester}
${institutionHint ? `- Institution: ${institutionHint}` : ''}

SYLLABUS RAW CONTENT:
"""
${syllabusText.slice(0, 20000)}
"""

CRITICAL INSTRUCTIONS:
1. Identify all distinct subjects/courses mentioned in the text.
2. For each subject, identify all Units or Modules.
3. For each Unit, extract the specific granular subtopics, concepts, algorithms, theorems, or skills.
4. Preserve original technical naming and wording.
5. If the text contains multiple subjects (e.g. BCA Sem 3 with Python, DBMS, OS), separate them into individual subjects!
6. Return ONLY a valid, parseable JSON object matching this exact schema:

{
  "program": "${defaultProgram}",
  "semester": "${defaultSemester}",
  "institution": "${institutionHint || ''}",
  "subjects": [
    {
      "name": "Subject Name (e.g. Python Programming)",
      "code": "Optional Subject Code (e.g. CS301)",
      "description": "Brief 1-sentence overview of subject",
      "units": [
        {
          "name": "Unit 1: Unit Title",
          "topics": [
            "Topic A",
            "Topic B",
            "Topic C"
          ]
        }
      ]
    }
  ]
}

DO NOT output markdown ticks \`\`\`json or prose. Return pure JSON.`;

  try {
    const responseText = await callGeminiREST(
      prompt,
      config,
      'You are a syllabus parser that outputs strictly valid JSON without markdown wrapping.'
    );

    // Clean JSON response
    let cleaned = responseText.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.slice(7);
    }
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.slice(3);
    }
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.slice(0, -3);
    }
    cleaned = cleaned.trim();

    const parsed: RawParsedSyllabus = JSON.parse(cleaned);

    // Validate structure
    if (parsed && Array.isArray(parsed.subjects) && parsed.subjects.length > 0) {
      // Ensure all subjects have units and topics
      const validatedSubjects = parsed.subjects.map(s => ({
        name: s.name || 'Untitled Subject',
        code: s.code || undefined,
        description: s.description || `Study module for ${s.name}`,
        units: (s.units || []).map(u => ({
          name: u.name || 'Unit 1: Core Concepts',
          topics: Array.isArray(u.topics) && u.topics.length > 0 ? u.topics : ['General Concepts']
        }))
      })).filter(s => s.units.length > 0);

      if (validatedSubjects.length > 0) {
        return {
          program: parsed.program || defaultProgram,
          semester: parsed.semester || defaultSemester,
          institution: parsed.institution || institutionHint || undefined,
          subjects: validatedSubjects
        };
      }
    }

    throw new Error('AI returned empty or invalid subject list');
  } catch (err: any) {
    console.warn('AI syllabus parsing failed, using rule-based parser fallback:', err);
    return parseSyllabusLocally(syllabusText, defaultProgram, defaultSemester);
  }
}

/**
 * Generates custom quiz questions strictly aligned with a syllabus topic
 */
export async function generateTopicQuizQuestions(
  subjectName: string,
  unitName: string,
  topicName: string,
  count = 4,
  config?: AIProviderConfig
): Promise<QuizQuestion[]> {
  const prompt = `Generate ${count} high-quality, multiple-choice quiz questions for the following specific syllabus topic:
Subject: ${subjectName}
Unit: ${unitName}
Topic: ${topicName}

Format as a JSON array of question objects:
[
  {
    "id": "q_1",
    "subject": "${subjectName}",
    "question": "Clear conceptual or problem-solving question",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0,
    "explanation": "Detailed explanation of why this answer is correct",
    "difficulty": "C"
  }
]
Return pure JSON only.`;

  try {
    const responseText = await callGeminiREST(
      prompt,
      config,
      'You are a tactical academic exam evaluator. Return strictly valid JSON arrays of questions.'
    );

    let cleaned = responseText.trim();
    if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
    if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
    if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
    cleaned = cleaned.trim();

    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((q, idx) => ({
        id: `gen_q_${Date.now()}_${idx}`,
        subject: subjectName,
        question: q.question,
        options: Array.isArray(q.options) && q.options.length === 4 ? q.options : ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
        correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
        explanation: q.explanation || 'Verified correct choice based on syllabus principles.',
        difficulty: (['F', 'E', 'D', 'C', 'B', 'A', 'S'].includes(q.difficulty) ? q.difficulty : 'D') as any
      }));
    }
  } catch (err) {
    console.error('Failed to generate syllabus questions:', err);
  }

  // Fallback high-quality template questions for this topic
  return [
    {
      id: `fallback_${Date.now()}_1`,
      subject: subjectName,
      question: `What is the foundational principle underlying ${topicName} in ${subjectName}?`,
      options: [
        `Deterministic execution and state invariance within ${topicName}`,
        `Arbitrary side effects without parameter encapsulation`,
        `Ignoring edge conditions and time complexity`,
        `Unsynchronized memory allocation`
      ],
      correctIndex: 0,
      explanation: `In ${subjectName}, ${topicName} establishes deterministic operational parameters and structured evaluation.`,
      difficulty: 'D'
    },
    {
      id: `fallback_${Date.now()}_2`,
      subject: subjectName,
      question: `When implementing ${topicName}, what is a critical best practice?`,
      options: [
        `Ensuring boundary verification and handling base cases`,
        `Hardcoding magic numbers across module scopes`,
        `Bypassing type validation`,
        `Discarding error traces during runtime`
      ],
      correctIndex: 0,
      explanation: `Robust implementations of ${topicName} always mandate strict boundary verification.`,
      difficulty: 'C'
    },
    {
      id: `fallback_${Date.now()}_3`,
      subject: subjectName,
      question: `How does ${topicName} integrate with ${unitName}?`,
      options: [
        `It serves as an essential modular building block for higher-level operations`,
        `It operates completely disconnected from all related concepts`,
        `It is deprecated in contemporary production paradigms`,
        `It only applies to uncompiled pseudo-code`
      ],
      correctIndex: 0,
      explanation: `${topicName} provides core architectural primitives required throughout ${unitName}.`,
      difficulty: 'B'
    }
  ];
}

/**
 * Generates an AI-powered personalized study plan based on the active syllabus and weakest topics
 */
export async function generateSyllabusStudyPlan(
  syllabus: { program: string; semester: string; subjects: { name: string; topicsCount: number }[] },
  weakTopics: { subjectName: string; topicName: string; progress: number }[],
  config?: AIProviderConfig
): Promise<{
  planTitle: string;
  summary: string;
  missions: {
    title: string;
    type: 'main' | 'revision' | 'quiz' | 'dungeon';
    subject: string;
    topic: string;
    description: string;
    rewardXp: number;
  }[];
}> {
  const weakSummary = weakTopics.slice(0, 4).map(w => `${w.subjectName} -> ${w.topicName} (${w.progress}% mastery)`).join(', ') || 'All topics in progress';

  const prompt = `Create a high-impact, tactical Daily Study Plan for a student enrolled in ${syllabus.program} (${syllabus.semester}).
Subjects: ${syllabus.subjects.map(s => s.name).join(', ')}
Priority Weak Topics: ${weakSummary}

Generate 3-4 specific tactical study missions (1 Main Quest, 1 Priority Revision, 1 Quiz Target, 1 Dungeon Challenge).
Return pure JSON:
{
  "planTitle": "Tactical Study Protocol - ${syllabus.semester}",
  "summary": "High-efficiency 2-hour study sequence focusing on weak topic breakthroughs.",
  "missions": [
    {
      "title": "Operation: Concept Breakthrough",
      "type": "main",
      "subject": "Subject Name",
      "topic": "Topic Name",
      "description": "Engage 25 minutes of deep focus on fundamental theorems.",
      "rewardXp": 150
    },
    {
      "title": "Neural Revision Protocol",
      "type": "revision",
      "subject": "Subject Name",
      "topic": "Topic Name",
      "description": "Reinforce memory retention on lowest mastery concepts.",
      "rewardXp": 120
    },
    {
      "title": "Combat Evaluation Trial",
      "type": "quiz",
      "subject": "Subject Name",
      "topic": "Topic Name",
      "description": "Score 80%+ on a 5-question mastery drill.",
      "rewardXp": 100
    }
  ]
}`;

  try {
    const res = await callGeminiREST(prompt, config);
    let cleaned = res.trim();
    if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
    if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
    if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
    return JSON.parse(cleaned);
  } catch {
    const topWeak = weakTopics[0] || { subjectName: syllabus.subjects[0]?.name || 'Core Subject', topicName: 'Foundations', progress: 0 };
    const secWeak = weakTopics[1] || { subjectName: syllabus.subjects[0]?.name || 'Core Subject', topicName: 'Methods', progress: 0 };
    return {
      planTitle: `Tactical Study Protocol - ${syllabus.semester}`,
      summary: `Automated hunter daily sequence targeting ${topWeak.topicName} and ${secWeak.topicName}.`,
      missions: [
        {
          title: `Mastery Focus: ${topWeak.topicName}`,
          type: 'main',
          subject: topWeak.subjectName,
          topic: topWeak.topicName,
          description: `Conduct 25 minutes of concentrated Pomodoro study on ${topWeak.topicName}.`,
          rewardXp: 150
        },
        {
          title: `Rapid Recall: ${secWeak.topicName}`,
          type: 'revision',
          subject: secWeak.subjectName,
          topic: secWeak.topicName,
          description: `Review flashcards and core formulas to raise mastery score.`,
          rewardXp: 100
        },
        {
          title: `Dungeon Gate Combat: ${topWeak.subjectName}`,
          type: 'dungeon',
          subject: topWeak.subjectName,
          topic: topWeak.topicName,
          description: `Defeat dungeon gate monster by solving combat quiz questions.`,
          rewardXp: 200
        }
      ]
    };
  }
}
