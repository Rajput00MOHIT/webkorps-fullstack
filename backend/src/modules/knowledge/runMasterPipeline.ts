import { MasterKnowledgePipeline } from './masterKnowledgePipeline.js';

async function main() {
  const orgId = '00000000-0000-0000-0000-000000000001';
  const report = await MasterKnowledgePipeline.execute(orgId);
  console.log('\n--- FINAL DATABASE & KNOWLEDGE ACQUISITION REPORT ---');
  console.log(JSON.stringify(report, null, 2));
}

main().catch(err => {
  console.error('Fatal Master Pipeline Error:', err);
  process.exit(1);
});
