export interface IEmbeddingProvider {
  readonly dimensions: number;
  readonly name: string;
  generateEmbedding(text: string): Promise<number[]>;
  generateBatchEmbeddings(texts: string[]): Promise<number[][]>;
}
