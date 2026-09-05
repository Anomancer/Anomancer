import fs from 'node:fs';
import path from 'node:path';

export const LIGHTHOUSE_STYLE_FILES=[
  '00-base.css',
  '10-work-surface.css',
  '20-trust.css',
  '30-workspace.css',
  '40-orchestra.css',
  '50-machine-room.css',
  '60-core.css',
  '70-depth-responsive.css',
  '80-intelligence.css',
  '90-ux-v2.css',
  '95-runtime-rails.css',
  '99-accessibility.css',
];

export function readLighthouseCss(root=process.cwd()){
  const dir=path.join(root,'app','lighthouse','styles');
  return LIGHTHOUSE_STYLE_FILES.map(file=>fs.readFileSync(path.join(dir,file),'utf8')).join('\n');
}
