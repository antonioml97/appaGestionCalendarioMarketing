import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { access, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const waitForServer = async (url: string) => {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok || response.status === 302) {
        return;
      }
    } catch {
      // El servidor puede seguir arrancando.
    }

    await delay(500);
  }

  throw new Error(`El servidor local no respondio a tiempo en ${url}.`);
};

const killProcessTree = async (pid?: number) => {
  if (!pid) {
    return;
  }

  if (process.platform === 'win32') {
    await new Promise<void>((resolve) => {
      const killer = spawn('taskkill', ['/pid', String(pid), '/T', '/F'], {
        stdio: 'ignore',
      });
      killer.on('exit', () => resolve());
      killer.on('error', () => resolve());
    });
    return;
  }

  try {
    process.kill(pid, 'SIGTERM');
  } catch {
    // El proceso ya puede haberse cerrado.
  }
};

export interface RunningServer {
  baseUrl: string;
  dataDir: string;
  logs: () => string;
  stop: () => Promise<void>;
}

export const startFeatureServer = async (): Promise<RunningServer> => {
  const port = 4600 + Math.floor(Math.random() * 300);
  const baseUrl = `http://127.0.0.1:${port}`;
  const dataDir = join(tmpdir(), `marketing-planner-tests-${randomUUID()}`);
  const stdout: string[] = [];
  const stderr: string[] = [];

  await mkdir(dataDir, { recursive: true });

  const child = process.platform === 'win32'
    ? spawn(
        'cmd.exe',
        ['/d', '/s', '/c', `npm run dev -- --host 127.0.0.1 --port ${port}`],
        {
          cwd: process.cwd(),
          env: {
            ...process.env,
            ASTRO_TELEMETRY_DISABLED: '1',
            FORCE_COLOR: '0',
            NO_COLOR: '1',
            PLANNER_DATA_DIR: dataDir,
          },
          stdio: ['ignore', 'pipe', 'pipe'],
        },
      )
    : spawn('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port)], {
        cwd: process.cwd(),
        env: {
          ...process.env,
          ASTRO_TELEMETRY_DISABLED: '1',
          FORCE_COLOR: '0',
          NO_COLOR: '1',
          PLANNER_DATA_DIR: dataDir,
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      });

  child.stdout?.on('data', (chunk) => stdout.push(String(chunk)));
  child.stderr?.on('data', (chunk) => stderr.push(String(chunk)));

  try {
    await waitForServer(`${baseUrl}/login`);
    await access(dataDir);
  } catch (error) {
    await killProcessTree(child.pid);
    throw new Error(
      `No se pudo arrancar el servidor de feature tests.\n\nSTDOUT:\n${stdout.join('')}\nSTDERR:\n${stderr.join('')}\n\n${String(error)}`,
    );
  }

  return {
    baseUrl,
    dataDir,
    logs: () => `${stdout.join('')}\n${stderr.join('')}`,
    stop: async () => {
      await killProcessTree(child.pid);
      await rm(dataDir, { recursive: true, force: true });
    },
  };
};
