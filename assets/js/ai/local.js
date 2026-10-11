import { buildBrief, generateStoryboard } from '../engine/storyboard.js';
export const local = {
  async generate(input) {
    const brief = buildBrief(input);
    return { brief, spec: generateStoryboard(brief, input.brand), briefSource: 'template', specSource: 'template', provider: 'local' };
  },
};
