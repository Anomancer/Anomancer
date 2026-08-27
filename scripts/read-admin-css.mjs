import fs from 'node:fs';
import path from 'node:path';

export const ADMIN_STYLE_FILES=['ui-tokens.css','admin-shell.css','admin-workspace.css','admin-editorial.css','admin-narrative.css','admin-control-plane.css','admin-archive.css','admin-nanomancer.css','admin-responsive.css'];
export function readAdminCss(root=process.cwd()){
  return ADMIN_STYLE_FILES.map(file=>fs.readFileSync(path.join(root,file),'utf8')).join('\n');
}
