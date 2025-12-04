# NextGenWeb Testing Guide

## Overview
This guide provides comprehensive testing instructions for all implemented features across the 3 major epics completed/in-progress.

---

## Epic #146: Interactive Website Feedback & Refinement System ✅

### Test 1: Access Preview System
**Route**: `/workspaces/[workspaceId]/websites/[websiteId]/preview`

**Steps:**
1. Navigate to http://localhost:1729/workspaces
2. Select a workspace (e.g., "BevGenieTest1")
3. Click "Websites" in sidebar
4. Select a website
5. Click blue **"Open Preview & Give Feedback"** button

**Expected Results:**
- ✅ Preview page loads without 404
- ✅ Preview toolbar visible with version selector
- ✅ Page navigation tabs show (if multiple pages)
- ✅ Full website renders in preview
- ✅ "Give Feedback" button visible

**Status**: Preview loads, needs full feedback testing

---

### Test 2: Version Management
**Acceptance Criteria:**
- Website has `draft_version_id` set
- Version selector shows "v1 - Initial Generation"
- Can switch between versions
- Version timeline accessible

**Steps:**
1. Generate a new website OR regenerate existing
2. Open preview page
3. Click **Version dropdown** in toolbar
4. Verify v1 appears
5. (If multiple versions) Switch between them

**Expected Results:**
- ✅ v1 created automatically on generation
- ✅ Version selector populated
- ⏳ Version switching updates preview (not fully tested)

**SQL Verification:**
```sql
SELECT * FROM website_versions WHERE website_id = '<your-website-id>';
```

---

### Test 3: Feedback & Refinement Flow
**Acceptance Criteria:**
- Sections are clickable in feedback mode
- Feedback panel slides in
- Can submit feedback
- Regeneration triggered
- New version created

**Steps:**
1. On preview page, ensure "Exit Feedback Mode" button shows (means you're in feedback mode)
2. Hover over website section (hero, features, etc.)
3. Should see blue outline + "Click to edit" tooltip
4. Click section
5. Feedback panel slides in from right
6. Type feedback or use quick actions
7. Click "✨ Apply Changes"

**Expected Results:**
- ✅ Section overlay component built
- ⏳ Hover effects need verification
- ⏳ Click → panel integration needs testing
- ⏳ Regeneration flow needs end-to-end test

**Note**: Feedback flow is 90% complete, needs final integration testing.

---

## Epic #177: Complete Product Reimplementation 🚀

### Phase 1 Complete: New Simplified Creation Flow

---

### Test 4: Simplified Dashboard
**Route**: `/dashboard`

**Acceptance Criteria:**
- Clean layout with max 6 website cards
- Single prominent "Create Website" button
- No clutter (stats, multiple actions removed)
- Empty state when no websites

**Steps:**
1. Navigate to http://localhost:1729/dashboard
2. Verify clean, simple layout
3. See "Create New Website" button (blue gradient)
4. Website cards show (if any exist)
5. Click on a card → Opens `/studio/[id]`

**Expected Results:**
- ✅ Simple, uncluttered design
- ✅ One primary action (Create)
- ✅ Progressive disclosure (settings hidden)
- ⏳ Needs API endpoint for websites_v2 table

**Status**: UI complete, needs API integration

---

### Test 5: Creation Wizard - Step 1 (Upload)
**Route**: `/create`

**Acceptance Criteria:**
- Drag-and-drop zone visible
- Can upload PDFs, Word docs, Excel, TXT
- Upload progress shown
- Auto-advances to Step 2 when complete

**Steps:**
1. Navigate to http://localhost:1729/create
2. See 3-step progress indicator at top
3. Drag file into dropzone OR click to browse
4. Upload file (up to 10 files, max 50MB each)
5. Watch upload progress bars
6. See "All files uploaded! Moving to AI discovery..."
7. Auto-advance to Step 2

**Expected Results:**
- ✅ Dropzone accepts files
- ✅ Progress bars update
- ✅ Auto-embedding triggers
- ✅ Advances to discovery automatically

**Status**: Component complete, needs upload API verification

---

### Test 6: Creation Wizard - Step 2 (AI Discovery)
**Route**: `/create` (Step 2)

**Acceptance Criteria:**
- AI presents understanding summary
- Asks 5-10 clarifying questions
- User can answer conversationally
- Suggested answer buttons work
- Shows "Ready to Generate" when complete

**Steps:**
1. After upload completes, Step 2 loads automatically
2. See AI message with business understanding
3. See first clarifying question
4. Type answer OR click suggested answer
5. AI asks next question
6. Continue through 5-10 questions
7. AI presents generation plan
8. "Generate Website" button appears

**Expected Results:**
- ✅ AI analyzes knowledge base
- ✅ Generates understanding summary
- ✅ Asks adaptive questions
- ✅ Tracks conversation context
- ✅ Determines readiness

**API Endpoints:**
- POST `/api/conversation/start` - Initiates discovery
- POST `/api/conversation/message` - Processes responses

**Status**: Fully functional, ready to test!

---

### Test 7: Creation Wizard - Step 3 (Live Generation)
**Route**: `/create` (Step 3)

**Acceptance Criteria:**
- Shows 4 stages (Layout, Storyline, Content, Finalize)
- Progress bars update in real-time
- Visual progress indicators
- Auto-redirects to studio when complete

**Steps:**
1. After discovery complete, click "Generate Website"
2. Step 3 loads with live progress
3. Watch stages progress:
   - Layout → Storyline → Content → Finalize
4. Each stage shows progress bar
5. Overall progress updates
6. On completion, redirects to `/studio/[websiteId]`

**Expected Results:**
- ✅ Visual progress display
- ⏳ Real-time updates (needs SSE implementation)
- ✅ Auto-redirect on completion

**API Endpoint:**
- POST `/api/conversation/[id]/generate`

**Status**: UI complete, needs streaming pipeline integration

---

## Testing Priority Order

### High Priority (Test First)
1. **Dashboard** → Create button → Navigate to `/create` ✓
2. **Upload** → File upload → Progress → Auto-advance ✓
3. **Discovery** → AI understanding → Questions → Answers ✓
4. **Generation** → Progress display → Redirect ⏳

### Medium Priority
5. **Version System** → v1 creation → Selector → Switching ⏳
6. **Feedback Flow** → Section click → Panel → Submit ⏳

### Integration Tests
7. **End-to-End**: Signup → Upload → Chat → Generate → Preview → Feedback → Publish
8. **Performance**: Time from upload to published < 15 minutes
9. **Error Handling**: Upload fails, generation fails, API errors

---

## Database Verification Queries

### Check Conversation Data
```sql
-- View all conversations
SELECT * FROM conversation_sessions ORDER BY created_at DESC LIMIT 10;

-- View conversation messages
SELECT cs.type, cm.role, cm.content, cm.created_at
FROM conversation_messages cm
JOIN conversation_sessions cs ON cm.session_id = cs.id
WHERE cs.id = '<session-id>'
ORDER BY cm.sequence_number;
```

### Check Websites V2
```sql
-- View new simplified websites
SELECT * FROM websites_v2 ORDER BY created_at DESC;

-- View website versions
SELECT * FROM website_versions_v2
WHERE website_id = '<website-id>'
ORDER BY version_number DESC;
```

---

## Success Metrics to Track

### User Journey Metrics
- **Time to first website**: Target <15 minutes
- **Completion rate**: Target >75%
- **Questions answered**: Average 5-7
- **Generation time**: Target <3 minutes

### Technical Metrics
- **Database queries**: <100ms p95
- **API responses**: <200ms p95
- **Build size**: Monitor bundle growth
- **Error rate**: <1% of requests

---

## Known Issues & Limitations

### Phase 1 (Current)
- ⚠️ Discovery conversation works but needs testing with real documents
- ⚠️ Generation creates website but needs full content pipeline
- ⚠️ Preview studio placeholder (Phase 2 feature)

### Not Yet Implemented
- ❌ Split-view studio (Phase 2)
- ❌ Real-time preview updates (Phase 2)
- ❌ Visual version comparison (Phase 3)
- ❌ One-click publishing (Phase 3)
- ❌ Persona detection (Phase 4)
- ❌ Embedded AI assistant (Phase 4)

---

## Next Phase Testing

### Phase 2: Preview Studio & Refinement
Will add tests for:
- Split-view layout (30% chat + 70% preview)
- Section click refinement
- Real-time WebSocket updates
- Device switcher

### Phase 3: Version Control & Publishing
Will add tests for:
- Visual version timeline
- Side-by-side comparison
- Subdomain provisioning
- DNS automation

### Phase 4: Dynamic Intelligence
Will add tests for:
- Persona detection accuracy (>70%)
- Content adaptation speed (<200ms)
- AI assistant responses (<2s)

---

## Quick Test Commands

```bash
# Start development server
npm run dev -- --port 1729

# Run build verification
npm run build

# Check for TypeScript errors
npx tsc --noEmit

# Run tests (when implemented)
npm run test
```

---

## Support & Troubleshooting

### Common Issues

**404 on /create:**
- Verify server is running
- Check Next.js routing cache
- Hard refresh browser

**Conversation doesn't start:**
- Check knowledge base has items
- Verify workspace_id is valid
- Check browser console for API errors

**Generation fails:**
- Check Supabase connection
- Verify AI API keys configured
- Check server logs for details

---

**Last Updated**: December 3, 2025
**Phase**: 1 Complete, 2-4 Planned
**Build Status**: ✅ Passing
