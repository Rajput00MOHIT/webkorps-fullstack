import React from 'react';
import type { BlogPost } from './insightsData';
import { getImgSrc } from '../../../utils/image';

interface BlogCardProps {
  post: BlogPost;
}

export const BlogCard: React.FC<BlogCardProps> = ({ post }) => {
  return (
    <article className="wk-blog-card" aria-labelledby={`blog-title-${post.id}`}>
      {/* Left Content Area */}
      <div className="wk-blog-card__content">
        {/* Date + Category Combined Pill */}
        <div className="wk-blog-card__pill">
          <time className="wk-blog-card__date" dateTime={post.date}>
            {post.displayDate}
          </time>
          <span className="wk-blog-card__category">{post.category}</span>
        </div>

        {/* Semantic Article Title */}
        <h3 id={`blog-title-${post.id}`} className="wk-blog-card__title">
          {post.title}
        </h3>

        {/* Read Blog Primary Action */}
        <div className="wk-blog-card__action">
          <a
            href={post.href}
            className="wk-blog-card__btn"
            aria-label={`Read Blog: ${post.title}`}
          >
            <span>Read Blog</span>
            <svg
              className="wk-blog-card__btn-icon"
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="3" y1="11" x2="11" y2="3" />
              <polyline points="4 3 11 3 11 10" />
            </svg>
          </a>
        </div>
      </div>

      {/* Right Artwork / Laptop Illustration */}
      <div className="wk-blog-card__media" aria-hidden="true">
        <img
          src={getImgSrc(post.image)}
          alt={post.imageAlt}
          className="wk-blog-card__img"
          loading="lazy"
          decoding="async"
        />
      </div>
    </article>
  );
};
