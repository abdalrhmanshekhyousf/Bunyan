import {
  Boxes,
  Cpu,
  Database,
  FolderTree,
  GitCommitHorizontal,
  Network,
  Repeat,
  Server,
  Shapes,
  Users,
  Workflow,
} from 'lucide-react'

// المخططات الأحد عشر (T5.13). الترتيب يطابق utils/diagramRegistry.js
// group: structure (بنيوي) أو behavior (سلوكي).
// الاسم وبطاقة التعريف (what/when/symbols) في locales/*/diagrams.json تحت types.{id}
export const DIAGRAMS = [
  { id: 'useCase', group: 'behavior', icon: Users },
  { id: 'class', group: 'structure', icon: Boxes },
  { id: 'object', group: 'structure', icon: Shapes },
  { id: 'sequence', group: 'behavior', icon: GitCommitHorizontal },
  { id: 'collaboration', group: 'behavior', icon: Network },
  { id: 'activity', group: 'behavior', icon: Workflow },
  { id: 'state', group: 'behavior', icon: Repeat },
  { id: 'er', group: 'structure', icon: Database },
  { id: 'package', group: 'structure', icon: FolderTree },
  { id: 'component', group: 'structure', icon: Cpu },
  { id: 'deployment', group: 'structure', icon: Server },
]

export const GROUPS = ['structure', 'behavior']
