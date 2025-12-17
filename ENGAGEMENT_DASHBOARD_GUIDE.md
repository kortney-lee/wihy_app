# Engagement & Marketing Dashboard Guide

## Overview
The engagement dashboard is a **public-facing performance tracker** that lets partners, marketers, and content creators see their individual impact without needing admin access or login credentials.

## How It Works

### 1. Access Via Email Link
Each partner gets a unique dashboard URL:
```
https://wihy.ai/engagement/THEIR_TRACKING_ID
```

**Example:**
- Partner Jane gets: `https://wihy.ai/engagement/instagram_jane`
- Partner ACME gets: `https://wihy.ai/engagement/partner_acme`
- Email campaign gets: `https://wihy.ai/engagement/email_newsletter_jan`

### 2. What They See

#### Key Metrics (Top Cards)
- **Total Clicks**: How many people clicked their tracking link
- **Conversions**: How many visitors clicked through to Kickstarter/Instagram/etc.
- **Conversion Rate**: Percentage of visitors who convert
- **Active Campaigns**: Number of different campaigns they're running

#### Performance Breakdown
- **Top Campaigns**: Their best-performing campaign names
- **Where People Go**: Distribution of destinations (Kickstarter, Instagram, etc.)
- **Recent Activity**: Real-time feed of latest clicks and conversions

#### Their Tracking Link
- Prominently displayed with a "Copy Your Link" button
- Shows: `https://wihy.ai/?ref=THEIR_TRACKING_ID`
- They share this link on social media, email, etc.

## Email Template for Partners

### Subject: Your Personal WIHY Performance Dashboard 🚀

```
Hi [Partner Name],

Thank you for partnering with WIHY to help us reach more people!

Here's your personal performance dashboard where you can track your impact in real-time:

🔗 Your Dashboard: https://wihy.ai/engagement/[THEIR_TRACKING_ID]

📊 What You'll See:
- Total clicks from your promotions
- Conversion rates to Kickstarter
- Your top-performing campaigns
- Real-time activity feed

📋 Your Unique Tracking Link:
https://wihy.ai/?ref=[THEIR_TRACKING_ID]

Share this link on your social media, email, or anywhere you promote WIHY. 
Every click will be tracked and shown on your dashboard instantly!

💰 Earnings/Bonuses:
[Your commission structure or bonus tiers based on conversions]

Questions? Reply to this email or contact us at info@wihy.ai

Let's make WIHY go viral together! 🎉

Best,
The WIHY Team
```

## Setting Up New Partners

### Step 1: Create Their Tracking ID
Go to `/tracking-admin` and generate a link with their tracking ID:

**Naming Convention:**
- Instagram partners: `instagram_firstname`
- Facebook partners: `facebook_groupname`
- Email campaigns: `email_campaign_date`
- YouTube creators: `youtube_channelname`

### Step 2: Send Them the Email
Use the template above with:
1. Their dashboard link: `/influencer/THEIR_TRACKING_ID`
2. Their tracking link: `/?ref=THEIR_TRACKING_ID`
3. Commission/bonus structure (if applicable)

### Step 3: They Start Sharing
- Influencer posts their tracking link on Instagram
- Dashboard updates in real-time as clicks come in
- You see their performance in `/tracking-dashboard`
- They see only their own stats in `/influencer/THEIR_ID`

## Real-World Example

**Jane (Instagram Partner)**

1. **Setup:**
   - Tracking ID: `instagram_jane`
   - Dashboard URL: `https://wihy.ai/engagement/instagram_jane`
   - Tracking Link: `https://wihy.ai/?ref=instagram_jane&campaign=beta_launch`

2. **Jane's Actions:**
   - Posts Instagram Story with her tracking link
   - Adds link in bio
   - Shares in DMs with followers

3. **What Jane Sees:**
   ```
   Total Clicks: 347
   Conversions: 89
   Conversion Rate: 26%
   
   Top Campaigns:
   1. beta_launch - 200 clicks
   2. story_promo - 147 clicks
   
   Where People Go:
   - Kickstarter: 65 clicks
   - Instagram (WIHY): 24 clicks
   
   Recent Activity:
   → OUT | beta_launch | Kickstarter | 2 min ago
   ← IN  | story_promo | /          | 5 min ago
   ```

4. **What You See (Admin Dashboard):**
   - Full attribution chain: Instagram → wihy.ai → Kickstarter
   - Jane's performance vs other influencers
   - ROI calculations for the partnership

## Privacy & Security

### Public Dashboard (Safe)
- ✅ Shows only their own stats
- ✅ No personal user data exposed
- ✅ No access to other influencers' data
- ✅ No admin functions visible
- ✅ Can't edit or delete data

### What's NOT Shown
- ❌ Individual user details (IP, name, email)
- ❌ Other partners' performance
- ❌ Admin analytics
- ❌ Financial data
- ❌ Full tracking event details

## API Endpoint

### GET /api/tracking/engagement/:trackingId

**Request:**
```
GET /api/tracking/engagement/instagram_jane
```

**Response:**
```json
{
  "trackingId": "instagram_jane",
  "totalClicks": 347,
  "totalConversions": 89,
  "conversionRate": 26,
  "topCampaigns": [
    { "campaign": "beta_launch", "clicks": 200 },
    { "campaign": "story_promo", "clicks": 147 }
  ],
  "destinations": [
    { "name": "Kickstarter", "clicks": 65 },
    { "name": "Instagram", "clicks": 24 }
  ],
  "recentActivity": [
    {
      "timestamp": "2025-01-20T10:30:00Z",
      "campaign": "beta_launch",
      "destination": "Kickstarter",
      "eventType": "outbound"
    }
  ]
}
```

## Integration with Main Dashboard

### Your View (Admin at /tracking-dashboard)
- See ALL partners' performance
- Compare conversion rates
- Track total campaign ROI
- View full attribution chains

### Partner's View (at /engagement/THEIR_ID)
- See ONLY their own performance
- Real-time updates
- Can copy their tracking link
- No access to admin features

## Bonus: Gamification Ideas

### Add to Email Template
```
🏆 Current Leaderboard:
- Top Partner: 1,234 conversions
- Your Rank: #12 (keep climbing!)

🎯 Next Milestone:
- 100 conversions: Unlock bonus tier
- 500 conversions: Featured on WIHY homepage
- 1,000 conversions: Exclusive partner status
```

### Dashboard Enhancements (Optional)
- Show leaderboard ranking (if they opt in)
- Display milestone progress bars
- Show daily/weekly goals
- Add achievement badges

## Mobile-Friendly
The dashboard is fully responsive:
- ✅ Works on phones, tablets, desktops
- ✅ Touch-friendly buttons
- ✅ Readable charts and stats
- ✅ Easy to share their link on mobile

## Common Questions

### Q: Can partners see other partners' stats?
**A:** No. Each dashboard URL is unique and shows only that partner's data.

### Q: Do they need to log in?
**A:** No. The dashboard is public and accessible via the unique URL you send them.

### Q: How often does it update?
**A:** Real-time. New clicks appear immediately.

### Q: Can they edit their stats?
**A:** No. It's read-only. Only admin can manage tracking data.

### Q: What if they lose their dashboard link?
**A:** Just resend the email with their `/influencer/THEIR_ID` URL.

### Q: Can I change their tracking ID later?
**A:** Not recommended. Create a new ID for new campaigns instead.

## Success Metrics to Track

For each partner, monitor:
1. **Click Volume**: How many people click their link
2. **Conversion Rate**: % who go to Kickstarter/destination
3. **Top Campaigns**: Which of their posts perform best
4. **ROI**: Conversions vs commission paid
5. **Engagement Time**: Time between click and conversion

## Next Steps

1. ✅ Generate tracking IDs for your partners/marketers
2. ✅ Send them the email template with their dashboard link
3. ✅ Monitor performance in `/tracking-dashboard`
4. ✅ Optimize: Give bonuses to top performers
5. ✅ Scale: Recruit more partners using success stories

---

**The engagement dashboard is now live at `/engagement/:trackingId`**

Example working URLs:
- `http://localhost:5173/engagement/test_partner`
- `https://wihy.ai/engagement/instagram_jane`
- `https://wihy.ai/engagement/partner_acme`
