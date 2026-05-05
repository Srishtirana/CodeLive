import express from 'express';
import { spawn } from 'child_process';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

router.use(authMiddleware);

const TEMP_DIR = path.join(__dirname, '../../temp');

// Ensure temp directory exists
fs.mkdir(TEMP_DIR, { recursive: true });

router.post('/code', async (req: AuthRequest, res) => {
  try {
    const { code, language } = req.body;

    if (!code || !language) {
      return res.status(400).json({ 
        success: false, 
        error: 'Code and language are required' 
      });
    }

    const executionId = uuidv4();
    const filePath = await createTempFile(executionId, code, language);
    
    try {
      const result = await executeCode(filePath, language);
      res.json({ success: true, output: result });
    } catch (error: any) {
      res.json({ success: false, error: error.message });
    } finally {
      // Clean up temp file
      try {
        await fs.unlink(filePath);
      } catch (cleanupError) {
        console.error('Failed to clean up temp file:', cleanupError);
      }
    }
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Execution failed' 
    });
  }
});

router.post('/terminal/command', async (req: AuthRequest, res) => {
  try {
    const { command } = req.body;

    if (!command) {
      return res.status(400).json({ 
        success: false, 
        error: 'Command is required' 
      });
    }

    // For security, only allow basic commands
    const allowedCommands = ['ls', 'pwd', 'echo', 'date', 'whoami', 'help'];
    const commandParts = command.split(' ');
    const baseCommand = commandParts[0];

    if (!allowedCommands.includes(baseCommand)) {
      return res.json({ 
        success: false, 
        error: `Command '${baseCommand}' is not allowed for security reasons` 
      });
    }

    const result = await executeCommand(command);
    res.json({ success: true, output: result });
  } catch (error: any) {
    res.json({ success: false, error: error.message });
  }
});

async function createTempFile(executionId: string, code: string, language: string): Promise<string> {
  const extensions: { [key: string]: string } = {
    javascript: 'js',
    typescript: 'ts',
    python: 'py',
    java: 'java',
    cpp: 'cpp',
    c: 'c',
    ruby: 'rb',
    go: 'go',
    php: 'php',
    html: 'html',
    css: 'css',
  };

  const ext = extensions[language] || 'txt';
  const fileName = `${executionId}.${ext}`;
  const filePath = path.join(TEMP_DIR, fileName);

  await fs.writeFile(filePath, code, 'utf8');
  return filePath;
}

async function executeCode(filePath: string, language: string): Promise<string> {
  return new Promise((resolve, reject) => {
    let command: string;
    let args: string[] = [];

    switch (language) {
      case 'javascript':
        command = 'node';
        args = [filePath];
        break;
      case 'python':
        command = 'python';
        args = [filePath];
        break;
      case 'java':
        // For Java, we need to compile first
        const javaFile = filePath;
        const classFile = javaFile.replace('.java', '.class');
        
        // Compile
        const compileProcess = spawn('javac', [javaFile]);
        compileProcess.on('close', (code) => {
          if (code !== 0) {
            reject(new Error('Java compilation failed'));
            return;
          }
          
          // Run
          const className = path.basename(javaFile, '.java');
          const runProcess = spawn('java', ['-cp', path.dirname(javaFile), className]);
          
          let output = '';
          runProcess.stdout.on('data', (data) => {
            output += data.toString();
          });
          
          runProcess.stderr.on('data', (data) => {
            output += data.toString();
          });
          
          runProcess.on('close', (code) => {
            if (code === 0) {
              resolve(output);
            } else {
              reject(new Error(output || 'Java execution failed'));
            }
          });
        });
        return;

      case 'cpp':
      case 'c':
        const compiler = language === 'cpp' ? 'g++' : 'gcc';
        const outputFile = filePath.replace(/\.[^.]+$/, '');
        
        // Compile
        const compileCpp = spawn(compiler, [filePath, '-o', outputFile]);
        compileCpp.on('close', (code) => {
          if (code !== 0) {
            reject(new Error(`${language.toUpperCase()} compilation failed`));
            return;
          }
          
          // Run
          const runProcess = spawn(outputFile);
          
          let output = '';
          runProcess.stdout.on('data', (data) => {
            output += data.toString();
          });
          
          runProcess.stderr.on('data', (data) => {
            output += data.toString();
          });
          
          runProcess.on('close', (code) => {
            if (code === 0) {
              resolve(output);
            } else {
              reject(new Error(output || `${language.toUpperCase()} execution failed`));
            }
          });
        });
        return;

      default:
        reject(new Error(`Unsupported language: ${language}`));
        return;
    }

    const process = spawn(command, args);
    
    let output = '';
    let errorOutput = '';
    
    process.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    process.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(errorOutput || `${language} execution failed`));
      }
    });
    
    process.on('error', (error) => {
      reject(new Error(`Failed to execute ${language}: ${error.message}`));
    });
  });
}

async function executeCommand(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const process = spawn(command, [], { shell: true });
    
    let output = '';
    let errorOutput = '';
    
    process.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    process.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(errorOutput || 'Command failed'));
      }
    });
    
    process.on('error', (error) => {
      reject(new Error(`Failed to execute command: ${error.message}`));
    });
  });
}

export default router;
