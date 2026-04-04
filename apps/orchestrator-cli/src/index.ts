import dotenv from 'dotenv';
import { startOrchestratorCli } from '@open-wa/orchestrator';

dotenv.config();

startOrchestratorCli().catch((error) => {
  console.error('Failed to start orchestrator CLI:', error);
  process.exit(1);
});
