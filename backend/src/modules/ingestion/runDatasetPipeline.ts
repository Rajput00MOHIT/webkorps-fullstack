import { db } from '../../db/client.js';
import { KnowledgeService } from '../knowledge/knowledgeService.js';
import { WebsiteIngestionEngine } from './websiteIngestionEngine.js';
import { TrainingDatasetGenerator } from './dataset/trainingDatasetGenerator.js';

async function main() {
  await db.ensureReady();
  const orgId = '00000000-0000-0000-0000-000000000001';

  console.log('========================================================');
  console.log('🚀 WEBKORPS PRODUCTION INGESTION & TRAINING ENGINE');
  console.log('========================================================\n');

  // Step 0: Seed Webkorps Ground-Truth Knowledge Graph & Organization
  console.log('--- STEP 0: Seed Authoritative Organization & Knowledge Graph ---');
  await KnowledgeService.seedWebkorpsGroundTruth();

  // Step 1: Ingest Live Website Content
  console.log('\n--- STEP 1: Live Webkorps Website Ingestion ---');
  const ingestionStats = await WebsiteIngestionEngine.runFullIngestion(orgId);
  console.log('Ingestion Stats:', ingestionStats);

  // Step 2: Fire Batch Queries & Build Model Training Dataset
  console.log('\n--- STEP 2: Generate & Fire Model Training Dataset ---');
  const datasetStats = await TrainingDatasetGenerator.generateAndStoreDataset(orgId);
  console.log('Dataset Stats:', datasetStats);

  console.log('\n========================================================');
  console.log('✅ ALL INGESTION & DATASET GENERATION TASKS COMPLETE!');
  console.log('========================================================');
}

main().catch(err => {
  console.error('Fatal Pipeline Execution Error:', err);
  process.exit(1);
});
