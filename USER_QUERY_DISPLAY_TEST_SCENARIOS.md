# User Query Display - Test Scenarios

## Test Execution Guide

### Setup
1. Start the development server
2. Navigate to the search page
3. Open the browser console to monitor logs

---

## Test Case 1: Camera Capture
**Steps:**
1. Click the camera icon in the search bar
2. Click "Camera" tab
3. Take a photo
4. Wait for analysis

**Expected Result:**
- Chat opens with user message: "Uploaded image: camera-capture-[timestamp].jpg"
- Followed by AI analysis response

**Verification:**
- User message appears before AI response
- Message clearly states "Uploaded image"
- AI response contains product analysis

---

## Test Case 2: File Upload (Drag & Drop)
**Steps:**
1. Click the camera icon
2. Drag and drop an image file
3. Wait for analysis

**Expected Result:**
- Chat opens with user message: "Uploaded image: [filename].jpg"
- Followed by AI analysis response

**Verification:**
- Actual filename is displayed
- File extension is shown
- Chat history preserved

---

## Test Case 3: File Upload (File Picker)
**Steps:**
1. Click the camera icon
2. Click "Upload" tab
3. Click "Choose file" button
4. Select an image
5. Wait for analysis

**Expected Result:**
- Chat opens with user message: "Uploaded image: [filename].jpg"
- Followed by AI analysis response

**Verification:**
- Selected filename matches display
- Both messages visible

---

## Test Case 4: Barcode Scanning (Camera)
**Steps:**
1. Click the camera icon
2. Click "Barcode" tab
3. Scan a product barcode
4. Wait for lookup

**Expected Result:**
- Chat opens with user message: "Scanned barcode: [barcode_number]"
- Followed by product information

**Verification:**
- Full barcode number displayed
- Product name appears in AI response
- Health score and nutrition facts shown

---

## Test Case 5: Barcode Scanning (Manual Entry)
**Steps:**
1. Click the camera icon
2. Click "Search" tab
3. Enter a valid barcode number (e.g., 049000050103)
4. Press Enter or click search

**Expected Result:**
- Chat opens with user message: "Scanned barcode: [barcode_number]"
- Followed by product information

**Verification:**
- Entered barcode matches display
- Product lookup successful

---

## Test Case 6: Product Name Search
**Steps:**
1. Click the camera icon
2. Click "Search" tab
3. Type a product name (e.g., "Coca Cola")
4. Press Enter

**Expected Result:**
- Chat opens with user message: "Searched for: Coca Cola"
- Followed by product information

**Verification:**
- Exact search term displayed
- Multiple results if applicable
- Product details shown

---

## Test Case 7: Image URL
**Steps:**
1. Click the camera icon
2. Click "Search" tab
3. Paste an image URL
4. Press Enter

**Expected Result:**
- Chat opens with user message: "Uploaded image: url-image"
- Followed by image analysis

**Verification:**
- URL fetched successfully
- Image analyzed
- Results displayed

---

## Test Case 8: Vision Analysis Fallback (API Unavailable)
**Steps:**
1. Disconnect from internet OR disable API
2. Upload an image
3. Wait for fallback

**Expected Result:**
- Chat opens with user message: "Uploaded image: [filename].jpg"
- Followed by vision analysis with warning:
  "[!] Note: Using basic vision analysis as food database lookup failed."

**Verification:**
- Fallback triggered
- Warning message displayed
- Basic analysis still provided

---

## Test Case 9: Vision Analysis Fallback (Scanning Fails)
**Steps:**
1. Upload an image of non-food item
2. Wait for analysis

**Expected Result:**
- Chat opens with user message: "Uploaded image: [filename].jpg"
- May fallback to vision analysis if food database can't identify

**Verification:**
- Graceful fallback
- User knows what was uploaded

---

## Test Case 10: Multiple Sequential Scans
**Steps:**
1. Scan product A
2. Verify chat shows "Scanned barcode: [barcode_A]"
3. Close chat
4. Scan product B
5. Verify chat shows "Scanned barcode: [barcode_B]"

**Expected Result:**
- Each scan shows its own user query
- Chat history is separate for each scan
- No data from previous scan

**Verification:**
- No cross-contamination
- Clean state between scans

---

## Test Case 11: Error Handling
**Steps:**
1. Enter invalid barcode
2. Check chat display

**Expected Result:**
- Error message displayed
- No userQuery shown for errors
- Clear error description

**Verification:**
- Graceful error handling
- User understands what went wrong

---

## Test Case 12: Mobile Responsiveness
**Steps:**
1. Open on mobile device or resize browser
2. Test camera capture
3. Verify chat display

**Expected Result:**
- User query message visible
- Properly formatted for mobile
- No text overflow

**Verification:**
- Mobile-friendly display
- Touch interactions work
- All text readable

---

## Console Verification

### Expected Console Logs:
```
[SEARCH] Handling barcode scan: 049000050103
[SEARCH] SEARCH RESULTS: New query - ...
[MOBILE] Opening FullScreenChat with...
```

### Check for:
- No TypeScript errors
- No React warnings
- Proper data flow logs

---

## Browser DevTools Inspection

### Elements to Check:
1. **User Message Element:**
   - `class="...user..."`
   - `message` property contains userQuery

2. **Assistant Message Element:**
   - `class="...assistant..."`
   - Follows user message

3. **Props Verification:**
   - `FullScreenChat` receives `initialQuery` and `initialResponse`
   - `initialResponse.userQuery` exists

---

## Regression Testing

### Ensure Existing Features Still Work:
- [ ] Regular text search
- [ ] Universal search API
- [ ] Chart generation
- [ ] Health dashboard
- [ ] Research analytics
- [ ] Navigation between tabs

---

## Known Edge Cases

### Case: Empty userQuery
**Scenario:** Older cached data without userQuery field  
**Expected:** Falls back to initialQuery prop  
**Verify:** No crashes, graceful degradation

### Case: Very Long Filename
**Scenario:** Upload file with 100+ character name  
**Expected:** Filename displayed (may truncate in UI)  
**Verify:** No layout breaks

### Case: Special Characters in Product Name
**Scenario:** Search "Ben & Jerry's"  
**Expected:** "Searched for: Ben & Jerry's"  
**Verify:** Special characters preserved

---

## Performance Checks

1. **Time to Display:**
   - User query appears immediately after onAnalysisComplete
   - No delay before chat opens

2. **Memory:**
   - No memory leaks from message history
   - Chat can be opened/closed multiple times

3. **Re-renders:**
   - Minimal re-renders on message addition
   - No infinite loops

---

## Acceptance Criteria

[OK] **Pass Criteria:**
- All test cases pass
- No console errors
- User sees what they scanned/uploaded
- Chat flow is natural and clear
- Mobile and desktop work correctly

[X] **Fail Criteria:**
- User query not displayed
- Wrong query displayed
- Chat crashes
- TypeScript errors
- Layout breaks on mobile

---

## Rollback Plan

If issues found:
1. Revert `FullScreenChat.tsx` changes
2. Revert `ImageUploadModal.tsx` changes
3. Test original functionality
4. Create hotfix branch

## Documentation Updates

- [x] Implementation guide created (USER_QUERY_DISPLAY_IMPLEMENTATION.md)
- [x] Test scenarios documented (this file)
- [ ] Update main README.md with new feature
- [ ] Add screenshots to docs

