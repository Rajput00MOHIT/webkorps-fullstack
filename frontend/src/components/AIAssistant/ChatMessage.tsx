'use client';

import React from 'react';
import type { ChatMessageData, SourceItem } from './types';
import { AIAvatar } from './AIAvatar';

interface ChatMessageProps {
  message: ChatMessageData;
  onActionClick?: (href: string) => void;
}

/**
 * Extracts a clean domain name and site label from a URL
 */
function getDomainInfo(url: string, explicitDomain?: string): { domain: string; siteName: string } {
  if (explicitDomain && explicitDomain.length > 0) {
    const cleanDomain = explicitDomain.replace(/^www\./i, '');
    const siteName = cleanDomain.split('.')[0];
    const capitalized = siteName.charAt(0).toUpperCase() + siteName.slice(1);
    return { domain: cleanDomain, siteName: capitalized };
  }

  try {
    const parsed = new URL(url);
    const domain = parsed.hostname.replace(/^www\./i, '');
    const parts = domain.split('.');
    const siteName = parts.length > 1 ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : domain;
    return { domain, siteName };
  } catch {
    return { domain: url, siteName: 'Web' };
  }
}

/**
 * Extracts markdown source references from text and returns cleaned body + structured sources
 */
function extractSourcesAndCleanText(
  rawText: string,
  existingCitations?: Array<{ title: string; url: string; domain?: string; snippet?: string }>
): { cleanedText: string; sources: SourceItem[] } {
  const sourcesMap = new Map<string, SourceItem>();
  let sourceIndex = 1;

  // 1. Add citations from structured backend payload if present
  if (existingCitations && existingCitations.length > 0) {
    existingCitations.forEach((c) => {
      if (c.url && !sourcesMap.has(c.url)) {
        const { domain, siteName } = getDomainInfo(c.url, c.domain);
        sourcesMap.set(c.url, {
          index: String(sourceIndex++).padStart(2, '0'),
          title: c.title || domain,
          url: c.url,
          domain: `${siteName} · ${domain}`,
          snippet: c.snippet,
        });
      }
    });
  }

  // 2. Extract markdown link citations from text (e.g., "[1] [Title](url)" or "[1] url")
  const citationRegex = /\[(\d+)\]\s*\[(.*?)\]\((https?:\/\/[^\s)]+)\)/g;
  let match: RegExpExecArray | null;
  while ((match = citationRegex.exec(rawText)) !== null) {
    const title = match[2].trim();
    const url = match[3].trim();
    if (url && !sourcesMap.has(url)) {
      const { domain, siteName } = getDomainInfo(url);
      sourcesMap.set(url, {
        index: String(sourceIndex++).padStart(2, '0'),
        title: title || domain,
        url,
        domain: `${siteName} · ${domain}`,
      });
    }
  }

  // 3. Remove "Sources consulted:" or "Sources:" footer blocks from main body text
  let cleanedText = rawText
    .replace(/(?:\r?\n)*Sources consulted:\s*(?:\[\d+\].*?)(?=\n\n|$)/gis, '')
    .replace(/(?:\r?\n)*Sources:\s*(?:\[\d+\].*?)(?=\n\n|$)/gis, '')
    .trim();

  // Also remove standalone bracketed citation lists at the end
  cleanedText = cleanedText.replace(/(?:\r?\n)+\[\d+\]\s*\[.*?\]\(https?:\/\/.*?\)(?=\n|$)/g, '').trim();

  return {
    cleanedText,
    sources: Array.from(sourcesMap.values()),
  };
}

/**
 * Renders inline text with bold markdown (**text**), code (`code`), or inline links
 */
function renderInlineFormatted(text: string): React.ReactNode {
  // Regex splitting by bold (**...**) and inline markdown links ([text](url))
  const parts = text.split(/(\*\*.*?\*\*|\[.*?\]\(https?:\/\/[^\s)]+\))/g);

  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={idx} className="wk-ai-message__strong">
          {part.slice(2, -2)}
        </strong>
      );
    }
    const linkMatch = part.match(/^\[(.*?)\]\((https?:\/\/[^\s)]+)\)$/);
    if (linkMatch) {
      return (
        <a
          key={idx}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="wk-ai-message__inline-link"
        >
          {linkMatch[1]}
        </a>
      );
    }
    return part;
  });
}

/**
 * Renders structured markdown content (headers, bullet points, numbered items, paragraphs)
 */
function renderMarkdownContent(content: string): React.ReactNode {
  const paragraphs = content.split(/\n\s*\n/);

  return paragraphs.map((para, pIdx) => {
    const lines = para.trim().split('\n');

    // Header 3 (### Header)
    if (lines[0]?.startsWith('### ')) {
      return (
        <h4 key={pIdx} className="wk-ai-message__section-title">
          {lines[0].replace(/^###\s+/, '')}
        </h4>
      );
    }

    // List of items (bullet or numbered)
    const isList = lines.every(
      (line) =>
        line.startsWith('• ') ||
        line.startsWith('- ') ||
        line.startsWith('* ') ||
        /^\d+\.\s+/.test(line)
    );

    if (isList && lines.length > 0) {
      return (
        <ul key={pIdx} className="wk-ai-message__list">
          {lines.map((line, lIdx) => {
            const cleanLine = line.replace(/^(?:[•\-*]|\d+\.)\s+/, '');
            return (
              <li key={lIdx} className="wk-ai-message__list-item">
                <span className="wk-ai-message__list-dot" aria-hidden="true" />
                <div className="wk-ai-message__list-text">{renderInlineFormatted(cleanLine)}</div>
              </li>
            );
          })}
        </ul>
      );
    }

    // Regular paragraph
    return (
      <p key={pIdx} className="wk-ai-message__paragraph">
        {lines.map((line, lIdx) => (
          <React.Fragment key={lIdx}>
            {renderInlineFormatted(line)}
            {lIdx < lines.length - 1 && <br />}
          </React.Fragment>
        ))}
      </p>
    );
  });
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, onActionClick }) => {
  const isUser = message.sender === 'user';

  const handleAction = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (onActionClick) {
      onActionClick(href);
    }
    if (href.startsWith('#')) {
      const targetId = href.replace('#', '');
      const el = document.getElementById(targetId);
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  if (isUser) {
    return (
      <div className="wk-ai-message wk-ai-message--user">
        <div className="wk-ai-message__bubble wk-ai-message__bubble--user">
          <p className="wk-ai-message__text">{message.text}</p>
        </div>
      </div>
    );
  }

  const { cleanedText, sources } = extractSourcesAndCleanText(message.text, message.citations);

  return (
    <div className="wk-ai-message wk-ai-message--ai">
      <div className="wk-ai-message__avatar-col">
        <AIAvatar size="md" />
      </div>
      <div className="wk-ai-message__content">
        <div className="wk-ai-message__bubble wk-ai-message__bubble--ai">
          {renderMarkdownContent(cleanedText)}

          {/* Structured Sources Section */}
          {sources.length > 0 && (
            <div className="wk-ai-sources">
              <div className="wk-ai-sources__header">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                <span>Sources Consulted ({sources.length})</span>
              </div>
              <div className="wk-ai-sources__list">
                {sources.map((src, idx) => (
                  <a
                    key={idx}
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="wk-ai-source-item"
                    title={src.title}
                  >
                    <span className="wk-ai-source-item__badge">{src.index}</span>
                    <div className="wk-ai-source-item__details">
                      <span className="wk-ai-source-item__title">{src.title}</span>
                      <span className="wk-ai-source-item__domain">{src.domain}</span>
                    </div>
                    <svg
                      className="wk-ai-source-item__icon"
                      width="12"
                      height="12"
                      viewBox="0 0 14 14"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M3.5 10.5L10.5 3.5M10.5 3.5H4.66667M10.5 3.5V9.33333" />
                    </svg>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Smart Quick Actions (Deep Research / Talk to Our Team) */}
        {message.actions && message.actions.length > 0 && (
          <div className="wk-ai-message__actions">
            {message.actions.map((act, aIdx) => (
              <a
                key={aIdx}
                href={act.href}
                className={`wk-ai-message__action-btn wk-ai-message__action-btn--${act.variant || 'primary'}`}
                onClick={(e) => handleAction(e, act.href)}
              >
                <span>{act.label}</span>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 14 14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M3.5 10.5L10.5 3.5M10.5 3.5H4.66667M10.5 3.5V9.33333" />
                </svg>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

