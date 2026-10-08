import { Massive10MillionStressTest } from './massive10MillionStressTest.js';

async function main() {
  const result = await Massive10MillionStressTest.run10MillionBenchmark();
  console.log('\n--- FINAL 10M BENCHMARK REPORT JSON ---');
  console.log(JSON.stringify(result, null, 2));
}

main().catch(err => {
  console.error('Fatal 10M Benchmark Error:', err);
  process.exit(1);
});
