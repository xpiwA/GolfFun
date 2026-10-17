import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const runtime = join(root, '.runtime');
const wordpress = join(runtime, 'WordPress-6.8.3');
mkdirSync(runtime, { recursive: true });
if (!existsSync(join(wordpress, 'wp-load.php'))) {
    console.log('Preparing WordPress 6.8.3 from the official WordPress GitHub repository…');
    const zip = join(runtime, 'wordpress.zip');
    const result = spawnSync('curl', ['--fail', '--location', '--silent', '--show-error', '--max-time', '60', 'https://github.com/WordPress/WordPress/archive/refs/tags/6.8.3.zip', '-o', zip], { stdio: 'inherit' });
    if (result.status !== 0) process.exit(result.status || 1);
    const unzip = spawnSync('python3', ['-c', 'import sys,zipfile; z=zipfile.ZipFile(sys.argv[1]); assert z.testzip() is None; z.extractall(sys.argv[2])', zip, runtime], { stdio: 'inherit' });
    if (unzip.status !== 0) process.exit(unzip.status || 1);
}
const cli = join(root, 'node_modules', '.bin', 'wp-playground-cli');
const server = spawn(cli, ['server', '--port=9400', '--workers=2', `--mount-before-install=${wordpress}:/wordpress`, `--mount=${root}:/wordpress/wp-content/plugins/GolfFun`, '--wordpress-install-mode=install-from-existing-files-if-needed', `--blueprint=${join(root, 'scripts/blueprint.json')}`, '--php=8.3'], { stdio: 'inherit', cwd: root });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.kill(signal));
server.on('exit', code => process.exit(code ?? 0));
server.on('error', error => { console.error(error.message); process.exit(1); });
