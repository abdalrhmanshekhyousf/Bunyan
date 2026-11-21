import { toActivity, toClass, toER, toSequence, toUseCase } from './toMermaid.js'
import {
  toCollaboration,
  toComponent,
  toDeployment,
  toObject,
  toPackage,
  toState,
} from './toMermaidExtra.js'

// المخططات الأحد عشر بترتيب عرضها. design: يحتاج بيانات استدعاء التصميم الثاني
export const DIAGRAM_TYPES = [
  { id: 'useCase', build: toUseCase },
  { id: 'class', build: toClass },
  { id: 'object', build: toObject, design: true },
  { id: 'sequence', build: toSequence },
  { id: 'collaboration', build: toCollaboration },
  { id: 'activity', build: toActivity },
  { id: 'state', build: toState, design: true },
  { id: 'er', build: toER },
  { id: 'package', build: toPackage, design: true },
  { id: 'component', build: toComponent, design: true },
  { id: 'deployment', build: toDeployment, design: true },
]

export const needsDesign = (id) => !!DIAGRAM_TYPES.find((d) => d.id === id)?.design

export function buildAll(a, opts) {
  return Object.fromEntries(DIAGRAM_TYPES.map(({ id, build }) => [id, build(a, opts)]))
}
