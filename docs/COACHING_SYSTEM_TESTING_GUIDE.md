# Coaching System End-to-End Testing Guide

**Version:** 1.0  
**Date:** January 21, 2026  
**Status:** Ready for Testing

---

## Overview

This guide provides comprehensive test scenarios for the coaching system UI implementation. All screens are now integrated and navigation is fully configured.

**Implementation Status:** 9/10 tasks complete (90%)
- ✅ All 8 screens implemented
- ✅ Navigation routes configured
- ⏳ End-to-end testing (this guide)

---

## Pre-Testing Setup

### 1. Environment Requirements

- **Platform:** iOS Simulator, Android Emulator, or Expo Go
- **Node Version:** 18.x or higher
- **Expo SDK:** Latest
- **Test Accounts:**
  - Coach account with `role: 'COACH'`
  - Client account with `role: 'CLIENT'`
  - Test email for invitation flow

### 2. Start the App

```bash
cd mobile
npm install
npx expo start
```

### 3. Known Limitations (Stubbed APIs)

The following API endpoints are currently mocked:
- `POST /api/coaches` (CoachProfileSetup)
- `GET /api/coaches/:id/profile` (CoachDetailPage - using mock data)
- `POST /api/coaches/:id/invite-client` (RequestCoaching)
- `POST /api/coaches/:id/send-invitation` (SendInvitation)
- `GET /api/coaches/invitations/:id` (AcceptInvitation - using mock data)
- `POST /api/coaches/:id/accept-invitation` (AcceptInvitation)
- `GET /api/coaches/:id/availability` (SessionBooking - mock 7 days)
- `POST /api/coaches/:id/bookings` (SessionBooking)

**Note:** All stubbed calls use setTimeout to simulate network delay (500ms-1500ms)

---

## Test Scenarios

### Test 1: Coach Signup & Profile Setup

**Objective:** Verify coach onboarding flow from role selection through profile creation

**Prerequisites:**
- New user account (not yet onboarded as coach)
- OR dev mode switcher to select coach role

**Steps:**

1. **Navigate to CoachProfileSetup**
   - Expected: Screen loads with step 1/3 indicator
   - Expected: Green collapsing header (#10b981)
   - Expected: Progress bar shows 33%

2. **Complete Step 1 - Basic Information**
   - Enter name: "John Doe"
   - Enter title: "Certified Nutrition Coach"
   - Select specialty: "Nutrition"
   - Click "Next"
   - Expected: Validation passes, move to step 2
   - Expected: Progress bar shows 66%

3. **Validation Testing (Step 1)**
   - Clear name field, click "Next"
   - Expected: Alert "Please fill in all required fields"
   - Fill name, clear title, click "Next"
   - Expected: Alert appears
   - Verify specialty is required

4. **Complete Step 2 - Background**
   - Enter bio: "Helping people achieve sustainable health goals..."
   - Enter years of experience: "5"
   - Enter credentials: "RD, NASM-CPT"
   - (Avatar upload is placeholder - skip)
   - Click "Next"
   - Expected: Move to step 3
   - Expected: Progress bar shows 100%

5. **Complete Step 3 - Pricing & Location**
   - Enter city: "San Francisco"
   - Enter state: "CA"
   - Enter country: "USA"
   - Enter session rate: "150"
   - Currency: USD (default)
   - Select available days: Mon, Tue, Wed, Thu, Fri
   - Set hours: 9:00 AM - 5:00 PM
   - Click "Complete Profile"
   - Expected: Loading state shows "Creating your profile..."
   - Expected: After 1.5s, success alert
   - Expected: Navigate to CoachDashboard

6. **Verify Navigation**
   - Expected: CoachDashboard loads
   - Expected: Client list shows 0 clients (new coach)

**Pass Criteria:**
- ✅ All 3 steps complete without errors
- ✅ Form validation works on each step
- ✅ Progress indicator updates correctly
- ✅ Navigation to CoachDashboard on success
- ✅ Character counter works on bio field
- ✅ Day selector toggles correctly

---

### Test 2: Client Finds Coach Flow

**Objective:** Test client-initiated coaching request workflow

**Prerequisites:**
- Client account logged in
- Mock coaches available in CoachSelection

**Steps:**

1. **Navigate to CoachSelection**
   - From tab bar, select "Coach Selection" (or navigate via menu)
   - Expected: Screen loads with indigo header (#6366f1)
   - Expected: Search bar visible
   - Expected: Specialty filters displayed
   - Expected: Coach cards displayed in grid

2. **Test Search & Filters**
   - Type "Sarah" in search bar
   - Expected: Results filter immediately (if debounce complete)
   - Clear search
   - Select specialty filter "Weight Loss"
   - Expected: Filter chips highlight
   - Expected: Coach list updates

3. **View Coach Profile**
   - Click any coach card OR click "View Profile" button
   - Expected: Navigate to CoachDetailPage
   - Expected: Pass coachId as route param
   - Expected: Screen loads with coach details
   - Expected: Avatar shows initials (SM for "Sarah Mitchell")
   - Expected: Star rating displayed (4.9 ★★★★★)
   - Expected: Review count shown (127 reviews)
   - Expected: About section with bio
   - Expected: Specialties badges (green theme)
   - Expected: Credentials list
   - Expected: Availability days and hours
   - Expected: Recent reviews section (3 reviews)

4. **Test Back Navigation**
   - Press back button
   - Expected: Return to CoachSelection
   - Expected: Previous scroll position maintained
   - Expected: Previous filters still active

5. **Request Coaching**
   - Click "Request Coaching" button on CoachDetailPage
   - Expected: RequestCoaching modal slides up
   - Expected: Modal shows coach name in header
   - Expected: Message textarea visible
   - Expected: Frequency radio buttons (Weekly selected by default)
   - Expected: Info box explains 24-48 hour response

6. **Form Validation (RequestCoaching)**
   - Click "Send Request" with empty message
   - Expected: Alert "Please enter a message"
   - Enter message: "I'm interested in your coaching..."
   - Expected: Character counter shows X/500

7. **Submit Request**
   - Enter valid message (50+ characters recommended)
   - Select frequency: "Bi-weekly"
   - Click "Send Request"
   - Expected: Button shows "Sending..." with spinner
   - Expected: After 1.5s, success alert
   - Expected: Alert message: "Request sent to [coach name]"
   - Expected: Modal closes automatically
   - Expected: Navigate back to CoachSelection

**Pass Criteria:**
- ✅ Search and filters work correctly
- ✅ Navigation between screens preserves params
- ✅ Coach data displays properly
- ✅ Modal presentation works smoothly
- ✅ Form validation prevents empty submissions
- ✅ Character counter updates in real-time
- ✅ Success flow completes without errors

---

### Test 3: Coach Invites Client Flow

**Objective:** Test coach-initiated invitation workflow

**Prerequisites:**
- Coach account logged in
- Access to CoachDashboard

**Steps:**

1. **Open SendInvitation Modal**
   - Navigate to CoachDashboard
   - Expected: "Invite Client" button visible in client list header
   - Click "Invite Client"
   - Expected: SendInvitation modal slides up from bottom
   - Expected: Modal header shows "Invite Client"
   - Expected: Info box explains invitation process

2. **Form Validation**
   - Click "Send Invitation" with all fields empty
   - Expected: Alert "Please enter client email address"
   - Enter invalid email: "notanemail"
   - Click "Send Invitation"
   - Expected: Alert "Please enter a valid email address"
   - Enter valid email but leave message empty
   - Click "Send Invitation"
   - Expected: Alert "Please add a personal message"

3. **Fill Invitation Form**
   - Enter client email: "client@example.com"
   - Enter client name: "Jane Smith" (optional)
   - Enter message: "Hi Jane, I'd love to help you achieve your health goals..."
   - Expected: Character counter shows X/500
   - Expected: Tips section visible with 4 bullet points

4. **Send Invitation**
   - Click "Send Invitation"
   - Expected: Button disabled, shows spinner
   - Expected: After 1.5s, success alert
   - Expected: Alert: "An email invitation has been sent to client@example.com"
   - Click OK on alert
   - Expected: Modal closes
   - Expected: Form resets
   - Expected: Client list refreshes (callback executed)

5. **Test Cancel**
   - Reopen SendInvitation modal
   - Fill in some fields
   - Click "Cancel" or close button (X)
   - Expected: Modal closes without sending
   - Expected: Form resets on next open

**Pass Criteria:**
- ✅ Email validation works (regex test)
- ✅ Required field validation enforced
- ✅ Character counter updates correctly
- ✅ Loading state displays during submission
- ✅ Success alert shows correct email
- ✅ Form resets after successful send
- ✅ Cancel button works without errors

---

### Test 4: Accept Invitation & Book Session Flow

**Objective:** Test complete client acceptance and booking workflow

**Prerequisites:**
- Access to AcceptInvitation screen (simulate deep link)
- Mock invitation data available

**Setup:**
```typescript
// Simulate navigation with params
navigation.navigate('AcceptInvitation', {
  invitationId: 'inv-123',
  coachId: 'coach-456'
});
```

**Steps:**

1. **Load AcceptInvitation Screen**
   - Navigate with invitation params
   - Expected: Loading state shows "Loading invitation..."
   - Expected: After 1s, screen loads with invitation details
   - Expected: Light blue background (#e0f2fe)
   - Expected: Coach profile card displays:
     - Avatar with initials "SM"
     - Name: "Dr. Sarah Mitchell"
     - Title: "Certified Nutrition Coach"
     - Rating: 4.9 stars with 127 reviews
     - Location and rate info

2. **Read Invitation Message**
   - Expected: Message card shows coach's personal message
   - Expected: Label: "Message from Sarah"
   - Expected: Full invitation text displayed

3. **Select First Session Option**
   - Default: "Schedule Now" should be selected
   - Click "Let Coach Contact Me"
   - Expected: Radio button toggles
   - Expected: Border color changes to blue (#3b82f6)
   - Click "Schedule Now" again
   - Expected: Radio button returns to first option

4. **Test Decline**
   - Click "Decline" button
   - Expected: Confirmation alert appears
   - Expected: Alert title: "Decline Invitation"
   - Expected: Alert message asks for confirmation
   - Click "Cancel" on alert
   - Expected: Stay on AcceptInvitation screen
   - Click "Decline" again, then "Decline" on alert
   - Expected: Loading spinner on Decline button
   - Expected: After 1s, alert "Invitation Declined"
   - Expected: Navigate to CoachSelection
   - **Note:** Stop test here if testing decline path

5. **Accept Invitation - Schedule Now Path**
   - Ensure "Schedule Now" is selected
   - Click "Accept & Continue" button
   - Expected: Button shows "Accepting..." with spinner
   - Expected: After 1.5s, success alert
   - Expected: Alert: "Invitation Accepted! You're now connected with Dr. Sarah Mitchell. Let's schedule your first session."
   - Click "Continue" on alert
   - Expected: Navigate to SessionBooking screen
   - Expected: Pass coachId and coachName as params

6. **Alternative Path - Let Coach Contact**
   - (Restart from step 1 with new navigation)
   - Select "Let Coach Contact Me"
   - Click "Accept & Continue"
   - Expected: After 1.5s, alert "Great! Dr. Sarah Mitchell will contact you within 24 hours"
   - Click OK
   - Expected: Navigate to CoachSelection (not SessionBooking)

**Pass Criteria:**
- ✅ Loading state works on screen load
- ✅ Mock data displays correctly
- ✅ Radio button selection works
- ✅ Decline confirmation dialog appears
- ✅ Accept flow navigates correctly based on selection
- ✅ Route params pass correctly to SessionBooking
- ✅ Error state displays if invitation fails to load

---

### Test 5: Session Booking Flow

**Objective:** Test calendar-based session booking

**Prerequisites:**
- Navigate from AcceptInvitation (accept + schedule now)
- OR navigate directly with params: `{ coachId: 'coach-456', coachName: 'Dr. Sarah Mitchell' }`

**Steps:**

1. **Load SessionBooking Screen**
   - Expected: Loading state shows "Loading availability..."
   - Expected: After 800ms, screen loads
   - Expected: Indigo collapsing header (#6366f1)
   - Expected: Header subtitle: "with Dr. Sarah Mitchell"
   - Expected: Next 7 days generated for calendar
   - Expected: Time slots generated (9 AM - 5 PM hourly)

2. **Select Session Type**
   - Default: "Initial Consultation" should be selected
   - Expected: Price shows $150
   - Expected: Duration shows 60 minutes
   - Click "Follow-up Session" (30 min)
   - Expected: Radio button toggles
   - Expected: Border color changes to blue
   - Expected: Price updates to $75
   - Click "Extended Follow-up" (60 min)
   - Expected: Price shows $120

3. **Select Date**
   - Scroll horizontal date picker
   - Expected: 7 date cards visible (tomorrow through 7 days out)
   - Click second date card (e.g., "Jan 23")
   - Expected: Card background changes to blue (#3b82f6)
   - Expected: Text color changes to white
   - Expected: Time slot grid appears below

4. **Select Time Slot**
   - Expected: Time slots display in grid layout
   - Expected: Some slots show as available (white background)
   - Expected: Some slots show as unavailable (gray, opacity 0.5)
   - Click an available time slot (e.g., "10:00 AM")
   - Expected: Slot background changes to blue
   - Expected: Text color changes to white
   - Click unavailable slot
   - Expected: No action (disabled state)

5. **Select Payment Method**
   - Expected: Payment section appears after time selection
   - Default: "Pay Now" should be selected
   - Expected: Shows "$150 charged immediately" (or current session price)
   - Click "Coaching Membership"
   - Expected: Radio button toggles
   - Expected: Shows "Use included session from membership"

6. **Review Booking Summary**
   - Expected: Summary card appears
   - Expected: Shows:
     - Coach: Dr. Sarah Mitchell
     - Session: Initial Consultation (or selected type)
     - Date: Jan 23 (or selected date)
     - Time: 10:00 AM (or selected time)
     - Total: $150 (or current price)
   - Expected: Summary has proper styling with border on total row

7. **Confirm Booking**
   - Expected: Bottom fixed "Confirm Booking" button visible
   - Expected: Button is green (#10b981)
   - Click "Confirm Booking"
   - Expected: Button shows "Booking..." with spinner
   - Expected: After 1.5s, success alert
   - Expected: Alert confirms booking with date/time
   - Click OK on alert
   - Expected: Navigate to CoachSelection

8. **Test Without Complete Form**
   - (Restart screen)
   - Select session type only, no date
   - Expected: No bottom button visible
   - Select date but no time
   - Expected: No bottom button visible
   - Select time
   - Expected: Button appears

**Pass Criteria:**
- ✅ 7 days of availability generate correctly
- ✅ Session type selection updates price
- ✅ Date selection shows time slots
- ✅ Time slot availability indicated correctly
- ✅ Unavailable slots are disabled
- ✅ Payment method selection works
- ✅ Booking summary shows all details accurately
- ✅ Confirm button only appears when form complete
- ✅ Success flow completes and navigates correctly

---

## Navigation Testing

### Deep Linking Tests

Test deep link functionality for AcceptInvitation:

**Test URL:** `wihy://invitation/inv-12345`

**Expected:**
- App opens directly to AcceptInvitation screen
- invitationId param = "inv-12345"
- Screen loads invitation data

**Web URL:** `https://wihy.ai/invitation/inv-12345`

**Expected:**
- Browser opens app (if installed)
- Falls back to web version
- Loads AcceptInvitation component

### Route Parameter Tests

Verify route params pass correctly:

1. **CoachDetailPage**
   ```typescript
   navigation.navigate('CoachDetailPage', { coachId: 'coach-123' });
   // Verify: route.params.coachId === 'coach-123'
   ```

2. **RequestCoaching**
   ```typescript
   navigation.navigate('RequestCoaching', {
     coachId: 'coach-123',
     coachName: 'Dr. Sarah Mitchell'
   });
   // Verify both params received
   ```

3. **SessionBooking**
   ```typescript
   navigation.navigate('SessionBooking', {
     coachId: 'coach-456',
     coachName: 'John Doe'
   });
   // Verify coach name in header
   ```

### Back Navigation Tests

Test back navigation from each screen:

| From Screen | Expected Back Destination |
|-------------|--------------------------|
| CoachProfileSetup | Previous screen (auth/signup) |
| CoachDetailPage | CoachSelection |
| RequestCoaching | Close modal, stay on CoachDetailPage |
| AcceptInvitation | Close invitation (navigate to CoachSelection) |
| SessionBooking | Previous screen (AcceptInvitation) |

**Test Steps:**
- Navigate through each flow
- Press device back button (Android) or swipe back (iOS)
- Verify correct navigation
- Verify no navigation stack errors

---

## Form Validation Testing

### Required Fields

Test all required field validations:

| Screen | Required Fields | Validation Message |
|--------|----------------|-------------------|
| CoachProfileSetup Step 1 | name, title, specialty | "Please fill in all required fields" |
| CoachProfileSetup Step 3 | city, state, country, rate | "Please fill in all required fields" |
| RequestCoaching | message | "Please enter a message" |
| SendInvitation | email, message | "Please enter client email address" / "Please add a personal message" |

### Field Validation Rules

| Field | Rule | Test Input | Expected |
|-------|------|------------|----------|
| Email | Valid email format | "notanemail" | Error: "Please enter a valid email address" |
| Email | Valid email format | "user@example.com" | Pass |
| Session Rate | Numeric only | "abc" | Prevent input or show error |
| Years Experience | Numeric only | "5" | Pass |
| Message | Max 500 chars | 501 char string | Truncate or prevent input |
| Bio | Max 500 chars | 501 char string | Truncate or prevent input |

### Character Counters

Verify character counters update in real-time:

- **RequestCoaching message:** 0/500, updates on every keystroke
- **SendInvitation message:** 0/500, updates on every keystroke
- **CoachProfileSetup bio:** 0/500, updates on every keystroke

---

## UI/UX Testing

### Design Pattern Compliance

Verify all screens follow [DESIGN_PATTERNS.md](DESIGN_PATTERNS.md):

| Screen | Background Color | Header Color | Collapsing Header |
|--------|-----------------|--------------|------------------|
| CoachProfileSetup | #e0f2fe | #10b981 (green) | ✅ 140px → 0px |
| CoachSelection | #e0f2fe | #6366f1 (indigo) | ✅ 140px → 0px |
| CoachDetailPage | #e0f2fe | #ffffff (white) | ❌ No header |
| AcceptInvitation | #e0f2fe | N/A | ❌ No collapsing header |
| SessionBooking | #e0f2fe | #6366f1 (indigo) | ✅ 140px → 0px |
| CoachDashboard | #e0f2fe | #3b82f6 (blue) | ✅ 140px → 0px |

### Animation Tests

Test all animations work smoothly:

1. **Collapsing Headers**
   - Scroll down → Header collapses
   - Scroll up → Header expands
   - Expected: Smooth interpolation, no jank

2. **Modal Presentations**
   - RequestCoaching → Slides up from bottom
   - SendInvitation → Slides up from bottom
   - Expected: Smooth 300ms animation

3. **Radio Buttons**
   - Click to select → Border color changes
   - Expected: Instant feedback

4. **Loading States**
   - All buttons show spinner when loading
   - Expected: Spinner visible, button text changes

### Responsive Design Tests

Test on different screen sizes:

- **Small Phone:** iPhone SE (375x667)
- **Standard Phone:** iPhone 14 (390x844)
- **Large Phone:** iPhone 14 Pro Max (430x932)
- **Tablet:** iPad (768x1024)

**Verify:**
- All content visible without horizontal scroll
- Cards adjust to screen width
- Text remains readable
- Buttons maintain minimum touch target (44px)
- Grid layouts wrap appropriately

---

## Performance Testing

### Load Time Benchmarks

Measure screen load times:

| Screen | Expected Load Time | Notes |
|--------|-------------------|-------|
| CoachSelection | < 1s | With 10 coaches |
| CoachDetailPage | < 1s | Mock data loads instantly |
| AcceptInvitation | < 1.5s | Mock API delay 1s |
| SessionBooking | < 1.5s | Mock availability generation |

### Network Simulation

Test under different network conditions:

1. **Fast 3G:** All screens should load within 2x expected time
2. **Slow 3G:** Loading states should show, no crashes
3. **Offline:** Graceful error messages

### Memory Tests

Monitor memory usage during:
- Rapid navigation between screens
- Multiple modal opens/closes
- Image loading (avatars)
- ScrollView with many items

**Expected:** No memory leaks, stable memory usage

---

## Error Handling Tests

### Network Errors

Simulate API failures:

1. **CoachProfileSetup Submit**
   - Mock API returns 500 error
   - Expected: Alert "Failed to create profile. Please try again."
   - Expected: Button re-enables for retry

2. **CoachDetailPage Load**
   - Mock API returns 404
   - Expected: Error state with retry button
   - Expected: Message: "Coach not found"

3. **SessionBooking Submit**
   - Mock API returns error
   - Expected: Alert "Failed to book session. Please try again."
   - Expected: Stay on SessionBooking screen

### Edge Cases

Test unusual scenarios:

1. **Empty States**
   - CoachSelection with 0 coaches
   - Expected: Empty state message
   - Expected: "No coaches found" with icon

2. **Long Text**
   - Coach bio with 500 characters
   - Expected: Text wraps properly
   - Expected: No overflow

3. **Special Characters**
   - Email: "test+tag@example.com"
   - Expected: Validation passes
   - Name: "O'Brien"
   - Expected: No errors

4. **Multiple Rapid Clicks**
   - Click "Confirm Booking" 5 times rapidly
   - Expected: Only one submission occurs
   - Expected: Button disables after first click

---

## Accessibility Testing

### Screen Reader Support

Test with VoiceOver (iOS) or TalkBack (Android):

1. **Labels**
   - All buttons have accessible labels
   - Form inputs have labels
   - Images have alt text (for avatars use initials)

2. **Focus Order**
   - Tab through form fields
   - Expected: Logical order (top to bottom)
   - Expected: No focus traps

3. **Announcements**
   - Loading states announce to screen reader
   - Error messages are announced
   - Success alerts are announced

### Color Contrast

Verify WCAG AA compliance:

- Button text on colored backgrounds
- Form labels on backgrounds
- Disabled state visibility

### Touch Targets

Verify all interactive elements meet minimum size:

- Buttons: 44px minimum height
- Radio buttons: 44px minimum touch area
- Close buttons: 44px minimum
- List items: 44px minimum height

---

## Cross-Platform Testing

### iOS-Specific Tests

1. **Safe Area Insets**
   - Test on iPhone with notch
   - Expected: Content not hidden by notch
   - Expected: Tab bar above home indicator

2. **Keyboard Behavior**
   - Open keyboard in forms
   - Expected: Screen adjusts, fields visible
   - Expected: ScrollView scrolls to active input

3. **Swipe Gestures**
   - Swipe right to go back
   - Expected: Works on all card presentations
   - Expected: Disabled on modal presentations

### Android-Specific Tests

1. **Back Button**
   - Press hardware back button
   - Expected: Navigates back correctly
   - Expected: Modals close properly

2. **Keyboard Behavior**
   - Open keyboard
   - Expected: Screen resizes or adjusts
   - Expected: Fields remain visible

3. **Status Bar**
   - Check status bar color matches header
   - Expected: Consistent color theming

### Web-Specific Tests

1. **Responsive Breakpoints**
   - Test at 768px, 1024px, 1440px
   - Expected: Layouts adjust appropriately

2. **Mouse Interactions**
   - Hover states on buttons
   - Click interactions
   - Expected: No touch-only limitations

---

## API Integration Checklist

When replacing stubbed API calls with real endpoints:

### CoachProfileSetup

- [ ] Replace mock POST /api/coaches with real endpoint
- [ ] Handle success response (201 Created)
- [ ] Handle validation errors (400 Bad Request)
- [ ] Handle authentication errors (401 Unauthorized)
- [ ] Navigate to CoachDashboard with created coachId
- [ ] Store coach profile in local state/context

### CoachDetailPage

- [ ] Replace mock GET /api/coaches/:id/profile with real endpoint
- [ ] Handle 404 if coach not found
- [ ] Handle network errors with retry option
- [ ] Display actual coach data from API
- [ ] Load actual reviews (currently shows 3 mock reviews)

### RequestCoaching

- [ ] Replace mock POST /api/coaches/:id/invite-client with real endpoint
- [ ] Send clientId from JWT token
- [ ] Handle invitation already exists (409 Conflict)
- [ ] Return invitation ID from API
- [ ] Update UI to show "Request already sent" if applicable

### SendInvitation

- [ ] Replace mock POST /api/coaches/:id/send-invitation with real endpoint
- [ ] Send actual invitation email
- [ ] Return invitation link for testing
- [ ] Handle duplicate email errors
- [ ] Refresh client list after successful send

### AcceptInvitation

- [ ] Replace mock GET /api/coaches/invitations/:id with real endpoint
- [ ] Handle expired invitations (403 Forbidden)
- [ ] Replace mock POST /api/coaches/:id/accept-invitation with real endpoint
- [ ] Create coaching relationship in database
- [ ] Send notification to coach
- [ ] Handle invitation already accepted (409 Conflict)

### SessionBooking

- [ ] Replace mock GET /api/coaches/:id/availability with real endpoint
- [ ] Load actual coach availability from database
- [ ] Filter out booked time slots
- [ ] Replace mock POST /api/coaches/:id/bookings with real endpoint
- [ ] Create booking record
- [ ] Generate Zoom/video call link
- [ ] Send confirmation emails
- [ ] Handle double-booking prevention
- [ ] Integrate with payment gateway (Stripe)
- [ ] Handle payment success/failure flows

---

## Test Reporting Template

Use this template to document test results:

```markdown
## Test Report - [Date]

**Tester:** [Name]
**Platform:** iOS 17.2 / Android 14 / Web Chrome
**Device:** iPhone 14 Pro / Pixel 7 / Desktop

### Test 1: Coach Signup & Profile Setup
- **Status:** ✅ PASS / ❌ FAIL
- **Notes:** [Any issues or observations]
- **Screenshots:** [If applicable]

### Test 2: Client Finds Coach Flow
- **Status:** ✅ PASS / ❌ FAIL
- **Notes:** 
- **Screenshots:** 

### Test 3: Coach Invites Client Flow
- **Status:** ✅ PASS / ❌ FAIL
- **Notes:** 
- **Screenshots:** 

### Test 4: Accept Invitation & Book Session Flow
- **Status:** ✅ PASS / ❌ FAIL
- **Notes:** 
- **Screenshots:** 

### Test 5: Session Booking Flow
- **Status:** ✅ PASS / ❌ FAIL
- **Notes:** 
- **Screenshots:** 

### Issues Found
1. [Issue description]
   - Severity: Critical / High / Medium / Low
   - Steps to reproduce:
   - Expected:
   - Actual:

### Summary
- Total Tests: 5
- Passed: X
- Failed: X
- Pass Rate: X%
```

---

## Known Issues & Limitations

### Current Limitations

1. **Mock API Data**
   - All API calls are stubbed with mock responses
   - No actual database integration
   - No real email sending

2. **Missing Features**
   - Avatar upload is placeholder (no actual upload)
   - "Message" button on CoachDetailPage shows alert (not implemented)
   - No actual video call integration
   - No payment processing integration

3. **Navigation**
   - TypeScript errors exist for missing `getCoachProfile` method in coachService
   - This is expected until real API is integrated

### Future Enhancements

- Real-time notifications for new invitations
- In-app messaging system
- Video call integration (Zoom/Teams)
- Payment processing (Stripe)
- Coach availability calendar sync (Google Calendar, Outlook)
- Advanced search filters (price range, location radius, ratings)
- Coach profile verification badges
- Client testimonials and ratings system

---

## Success Criteria

The coaching system is ready for production when:

- ✅ All 5 test scenarios pass on iOS and Android
- ✅ Navigation works correctly in all directions
- ✅ Form validation prevents invalid submissions
- ✅ Loading states display properly
- ✅ Error handling is graceful
- ✅ Design patterns are followed consistently
- ✅ All route params pass correctly
- ✅ Deep linking works for invitation emails
- ✅ Accessibility requirements met
- ✅ No memory leaks or performance issues
- ⏳ Real API endpoints integrated (not yet done)
- ⏳ Payment processing working (not yet done)
- ⏳ Email notifications working (not yet done)

---

## Next Steps

1. **Run Tests:** Execute all test scenarios on iOS and Android
2. **Document Issues:** Use test reporting template to log any failures
3. **Fix Bugs:** Address critical and high-severity issues
4. **API Integration:** Replace stubbed calls with real endpoints
5. **User Acceptance Testing:** Get feedback from real coaches and clients
6. **Production Deployment:** Deploy to app stores after all tests pass

---

**Document Version:** 1.0  
**Last Updated:** January 21, 2026  
**Status:** Ready for QA Testing
