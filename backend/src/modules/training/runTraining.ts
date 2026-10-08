import { ModelTrainingPipeline } from './modelTrainingPipeline.js';

async function main() {
  const orgId = '00000000-0000-0000-0000-000000000001';
  const res = await ModelTrainingPipeline.runTrainingSynthesis(orgId);
  console.log('Result:', res);
}

main().catch(err => {
  console.error('Fatal Training Error:', err);
  process.exit(1);
});
