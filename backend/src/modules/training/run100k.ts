import { Massive100kGenerator } from './massive100kGenerator.js';

async function main() {
  const result = await Massive100kGenerator.generateAndTrain('00000000-0000-0000-0000-000000000001');
  console.log('Result Summary:', result);
}

main().catch(err => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
