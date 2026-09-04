# LifePera Auto Social Sharing - Project Plan

## Overview
Automated system to share new blog posts and tool pages from lifepera.com to Facebook, Instagram, Twitter/X, Pinterest, LinkedIn, and Threads.

---

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│  lifepera.com   │────▶│  GitHub Actions  │────▶│  Social Platforms   │
│  (source data)  │     │  (orchestrator)  │     │  (APIs)             │
└─────────────────┘     └──────────────────┘     └─────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
            ┌───────────────┐    ┌───────────────┐
            │ blog-index.json│   │ all_tools.json │
            │ (new posts)    │    │ (all tools)    │
            └───────────────┘    └───────────────┘
```

---

## Data Sources

### 1. Blog Posts
- **Source**: `https://lifepera.com/blog-index.json`
- **Trigger**: New entry added (GitHub Actions on schedule or webhook)
- **Content**: Title, category, emoji, date, URL, featured image (og:image)

### 2. Tool Pages
- **Source**: `https://lifepera.com/all_tools.json`
- **Trigger**: New tool added or weekly rotation
- **Content**: Title, description, category, URL, og:image

---

## Platform Requirements

| Platform | API | Auth | Content Format | Limits |
|----------|-----|------|----------------|--------|
| **Twitter/X** | API v2 | OAuth 2.0 | Text + image + link | 280 chars |
| **Facebook** | Graph API | Page Access Token | Text + image + link | 63,206 chars |
| **Instagram** | Graph API | Page Access Token | Image + caption | 2,200 chars |
| **Pinterest** | API v5 | OAuth 2.0 | Image + title + desc + link | 500 chars desc |
| **LinkedIn** | API v2 | OAuth 2.0 | Text + image + link | 3,000 chars |
| **Threads** | Instagram Graph API | Same as IG | Text + image + link | 500 chars |

---

## Repository Structure

```
lifepera-social-sharer/
├── .github/
│   └── workflows/
│       ├── share-new-post.yml      # Triggered by blog-index.json change
│       ├── share-tool-rotation.yml # Weekly tool sharing
│       └── retry-failed.yml        # Retry failed posts
├── src/
│   ├── config/
│   │   ├── platforms.yaml          # Platform configs, hashtags, templates
│   │   └── secrets.yaml.example    # Template for required secrets
│   ├── fetch/
│   │   ├── blog.py                 # Fetch blog-index.json, detect new posts
│   │   └── tools.py                # Fetch all_tools.json, select tools
│   ├── generate/
│   │   ├── content.py              # Generate platform-specific content
│   │   ├── images.py               # Generate og:image variants (optional)
│   │   └── hashtags.py             # Category-based hashtag mapping
│   ├── post/
│   │   ├── twitter.py              # X/Twitter posting
│   │   ├── facebook.py             # Facebook posting
│   │   ├── instagram.py            # Instagram posting
│   │   ├── pinterest.py            # Pinterest posting
│   │   ├── linkedin.py             # LinkedIn posting
│   │   └── threads.py              # Threads posting
│   ├── state/
│   │   └── tracker.py              # Track posted content (SQLite/JSON)
│   └── main.py                     # Entry point
├── tests/
│   ├── test_content_generation.py
│   ├── test_platform_apis.py
│   └── fixtures/
├── requirements.txt
├── Dockerfile
├── README.md
└── .env.example
```

---

## Content Templates

### Blog Post Template
```
{emoji} New Article: {title}

{short_description}

Read more: {url}

{hashtags}
#LifePera #LifeTools #FreeTools
```

### Tool Page Template
```
{emoji} Try This Free Tool: {tool_name}

{tool_description}

Use it free: {url}

{hashtags}
#LifePera #FreeTools #LifeDecisions
```

### Category Hashtag Mapping
```yaml
career: "#CareerAdvice #JobSearch #WorkLife #CareerGrowth"
finance: "#PersonalFinance #MoneyTips #FinancialLiteracy #Budgeting"
travel: "#TravelTips #TravelHacks #SoloTravel #BudgetTravel"
relationships: "#RelationshipAdvice #DatingTips #Communication #Love"
psychology: "#MentalHealth #Psychology #SelfImprovement #Mindfulness"
culture: "#CulturalAwareness #TravelCulture #GlobalCitizen"
```

---

## GitHub Actions Workflows

### 1. Share New Blog Post (`share-new-post.yml`)
```yaml
name: Share New Blog Post
on:
  schedule:
    - cron: '0 * * * *'  # Every hour
  workflow_dispatch:
  
jobs:
  check-and-share:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Fetch blog index
        run: python src/fetch/blog.py
      - name: Detect new posts
        run: python src/fetch/detect_new.py
      - name: Generate content
        run: python src/generate/content.py --type blog
      - name: Post to platforms
        run: python src/main.py --type blog
        env:
          # All API tokens from GitHub Secrets
```

### 2. Weekly Tool Rotation (`share-tool-rotation.yml`)
```yaml
name: Weekly Tool Share
on:
  schedule:
    - cron: '0 9 * * 1'  # Monday 9 AM UTC
  workflow_dispatch:
```

### 3. Retry Failed (`retry-failed.yml`)
```yaml
name: Retry Failed Posts
on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
```

---

## Required GitHub Secrets

```
# Twitter/X
TWITTER_API_KEY
TWITTER_API_SECRET
TWITTER_ACCESS_TOKEN
TWITTER_ACCESS_TOKEN_SECRET
TWITTER_BEARER_TOKEN

# Facebook + Instagram (same app)
FB_APP_ID
FB_APP_SECRET
FB_PAGE_ACCESS_TOKEN
FB_PAGE_ID
IG_USER_ID

# Pinterest
PINTEREST_APP_ID
PINTEREST_APP_SECRET
PINTEREST_ACCESS_TOKEN
PINTEREST_BOARD_ID

# LinkedIn
LINKEDIN_CLIENT_ID
LINKEDIN_CLIENT_SECRET
LINKEDIN_ACCESS_TOKEN
LINKEDIN_ORG_ID

# Threads (uses Instagram credentials)
THREADS_USER_ID
```

---

## State Tracking

Store posted content to avoid duplicates:
```json
{
  "posted": {
    "blog": ["post-2026-08-28-...", "post-2026-08-27-..."],
    "tools": ["tool-how-rich", "tool-visa", "tool-attachment"]
  },
  "last_checked": "2026-09-02T10:00:00Z"
}
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Create repo with structure
- [ ] Set up GitHub Actions workflows
- [ ] Implement blog/tools fetchers
- [ ] Build content generator with templates
- [ ] Add state tracker (JSON file in repo)

### Phase 2: Platform Integrations (Week 2-3)
- [ ] Twitter/X API v2
- [ ] Facebook Graph API
- [ ] Instagram Graph API
- [ ] Pinterest API v5
- [ ] LinkedIn API v2
- [ ] Threads API

### Phase 3: Content Intelligence (Week 3-4)
- [ ] Category-based hashtags
- [ ] Dynamic image generation (og:image variants)
- [ ] A/B test templates
- [ ] Best-time-to-post scheduling

### Phase 4: Monitoring & Reliability (Week 4)
- [ ] Retry logic with exponential backoff
- [ ] Failure notifications (GitHub Issues/Slack)
- [ ] Analytics tracking (clicks, engagement)
- [ ] Rate limit handling

---

## Rate Limits & Best Practices

| Platform | Daily Limit | Best Practice |
|----------|-------------|---------------|
| Twitter | 300 posts/3hr | Space 30+ min apart |
| Facebook | 25/page/day | Max 1-2/day |
| Instagram | 25/day | 1/day, carousel for tools |
| Pinterest | 1000/day | 3-5/day OK |
| LinkedIn | 100/day | 1/day |
| Threads | 250/day | 1-2/day |

---

## Image Strategy

1. **Use existing og:image** from each page (already implemented)
2. **Generate platform-specific variants**:
   - Twitter: 1200×675 (16:9)
   - Facebook: 1200×630 (1.91:1)
   - Instagram: 1080×1080 (1:1) + 1080×1350 (4:5)
   - Pinterest: 1000×1500 (2:3)
   - LinkedIn: 1200×627 (1.91:1)

---

## Deployment

```bash
# Local testing
docker build -t lifepera-sharer .
docker run --env-file .env lifepera-sharer --dry-run

# Deploy: Push to main branch → GitHub Actions auto-runs
```

---

## Estimated Timeline: 4 weeks
- **Week 1**: Core infrastructure + fetchers
- **Week 2**: Twitter + Facebook + Instagram
- **Week 3**: Pinterest + LinkedIn + Threads
- **Week 4**: Polish, monitoring, analytics

---

## Future Enhancements
- [ ] Auto-generate short videos (Reels/TikTok/Shorts) from tool demos
- [ ] Cross-post to Mastodon/Bluesky
- [ ] Email newsletter integration
- [ ] RSS feed for social content
- [ ] Engagement analytics dashboard