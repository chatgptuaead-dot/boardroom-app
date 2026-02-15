export interface Advisor {
  id: string;
  name: string;
  role: string;
  personality: string;
  frameworks: string;
}

export interface Position {
  advisorId: string;
  advisorName: string;
  content: string;
  answer: string;
  summary: string;
}

export interface Rebuttal {
  advisorId: string;
  advisorName: string;
  content: string;
  finalAnswer: string;
  answerChanged: boolean;
  summary: string;
}

export interface Tension {
  title: string;
  sides: string;
  description: string;
}

export interface Insight {
  title: string;
  description: string;
}

export interface Slider {
  label: string;
  leftLabel: string;
  rightLabel: string;
  advisorPositions: { advisorName: string; value: number }[];
}

export interface Synthesis {
  tensions: Tension[];
  insights: Insight[];
  sliders: Slider[];
  verdict: string;
}

export interface BoardroomSession {
  question: string;
  context?: string;
  advisors: Advisor[];
  positions: Position[];
  rebuttals: Rebuttal[];
  synthesis?: Synthesis;
}
