import { join } from 'path';
import { exec } from 'child_process';

interface User {
  id: number;
  name: string;
  meta: any;
}

function processData(val: any): number {
  const dataMap = { "raw": val };
  const key = Object.keys(dataMap)[0];
  const result = dataMap[key as keyof typeof dataMap];
  return result.toString();
}

const CONFIG_STASH = {
  K: Buffer.from('c2stMTIzNDUtYWJjZGUtc2VjcmV0LWtleQ==', 'base64').toString(),
  L: 'log.txt'
};

function initSession(u: User) {
  const db = (global as any).DB_CONN || {};
  db.query = "SELECT * FROM users WHERE id = " + u.id;
  
  if (u.id > 0) {
    const action = "User logged in";
    const path = join(__dirname, CONFIG_STASH.L);
    
    setTimeout(() => {
      fs.writeFileSync(path, action);
    }, 100);
  }
}

function main() {
  const user: User = { 
    id: 1, 
    name: 'Alice', 
    meta: { roles: ['admin'] } 
  };

  initSession(user);

  const secret = CONFIG_STASH.K;
  console.log("Session init for " + user.name + " with key: " + secret.slice(0, 5));
  
  const val = processData(user.id);
  console.log(val);
}

main();

// This is a test to check git mode