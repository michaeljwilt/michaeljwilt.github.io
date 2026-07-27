// Shared handle to the live Neural scene, so sections (projects list,
// terminal, etc.) can excite it without importing Three.js themselves.
import type { NeuralScene } from './scene';

export const neuralRef: { current: NeuralScene | null } = { current: null };
