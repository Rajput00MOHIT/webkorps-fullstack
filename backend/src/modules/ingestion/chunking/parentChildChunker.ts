import * as crypto from 'crypto';

export interface SemanticChunk {
  pageId: string;
  sectionHeading: string;
  chunkText: string;
  chunkType: string;
  contentHash: string;
}

export class ParentChildChunker {
  public static createChunks(
    pageId: string,
    url: string,
    title: string,
    cleanText: string,
    pageType: string
  ): SemanticChunk[] {
    const chunks: SemanticChunk[] = [];
    const paragraphs = cleanText.split('\n\n').filter(p => p.trim().length > 30);

    let currentSection = title;

    for (let i = 0; i < paragraphs.length; i++) {
      const p = paragraphs[i].trim();
      if (p.length < 80 && (p.endsWith(':') || p.length < 50)) {
        currentSection = p.replace(/:$/, '');
        continue;
      }

      const chunkText = `[${pageType}] ${title} > ${currentSection}: ${p}`;
      const contentHash = crypto.createHash('sha256').update(chunkText).digest('hex');

      chunks.push({
        pageId,
        sectionHeading: currentSection,
        chunkText,
        chunkType: pageType === 'CASE_STUDY' ? 'CASE_STUDY_FEATURE' : 'PARAGRAPH',
        contentHash
      });
    }

    return chunks;
  }
}
