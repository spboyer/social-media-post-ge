# Social Media Post Generator

Transform any content into platform-optimized social media posts using AI-powered content adaptation.

**Experience Qualities**: 
1. **Intuitive** - Users can immediately understand how to input content and generate posts without guidance
2. **Efficient** - Fast content transformation with clear platform-specific formatting and character limits
3. **Professional** - Clean, trustworthy interface that feels suitable for business and personal use

**Complexity Level**: Light Application (multiple features with basic state)
- Handles content input, AI processing, platform selection, and post generation with persistent user preferences

## Essential Features

### Content Input System
- **Functionality**: Accept text input (sentence/paragraph) or website URL for content extraction
- **Purpose**: Flexible content ingestion to accommodate different user workflows
- **Trigger**: User types in text area or pastes URL
- **Progression**: Input detection → Content validation → Enable generation button
- **Success criteria**: Clear input feedback and URL content preview

### Platform Selection
- **Functionality**: Multi-select checkboxes for LinkedIn, Instagram, X (Twitter), and Facebook
- **Purpose**: Allow users to generate posts for multiple platforms simultaneously
- **Trigger**: User clicks platform checkboxes
- **Progression**: Platform selection → Visual confirmation → Generation options update
- **Success criteria**: Clear visual state showing selected platforms

### AI Post Generation
- **Functionality**: Transform input content into platform-specific posts using AI
- **Purpose**: Create optimized content that follows each platform's best practices and character limits
- **Trigger**: User clicks "Generate Posts" button
- **Progression**: Input validation → AI processing → Platform-specific post display
- **Success criteria**: Generated posts respect character limits and platform conventions

### Post Management
- **Functionality**: Display, edit, and copy generated posts with platform-specific formatting
- **Purpose**: Allow users to review and customize posts before publishing
- **Trigger**: After successful generation
- **Progression**: Post display → Edit inline → Copy to clipboard → Success feedback
- **Success criteria**: Easy copying and clear success notifications

## Edge Case Handling
- **Invalid URLs**: Show clear error message with suggestion to check URL format
- **Network failures**: Graceful degradation with retry options and offline capability notice
- **AI API limits**: Queue requests and show estimated wait times during high usage
- **Empty content**: Disable generation button and show helpful placeholder text
- **Character overruns**: Auto-truncate with smart sentence breaking and warning indicators

## Design Direction
The design should feel modern, professional, and trustworthy like a premium business tool, with clean typography and purposeful use of color to guide users through the content creation workflow.

## Color Selection
Complementary (blue and orange) - Using professional blue as primary for trust and reliability, with warm orange accents for call-to-action elements and success states.

- **Primary Color**: Deep Professional Blue `oklch(0.45 0.15 240)` - Communicates trust, professionalism, and reliability
- **Secondary Colors**: Light Blue `oklch(0.95 0.02 240)` for backgrounds and Neutral Gray `oklch(0.85 0.01 240)` for borders
- **Accent Color**: Warm Orange `oklch(0.65 0.15 45)` - Attention-grabbing for CTAs and positive feedback
- **Foreground/Background Pairings**: 
  - Background (White `oklch(1 0 0)`): Dark Gray text `oklch(0.2 0.01 240)` - Ratio 16.0:1 ✓
  - Primary (Deep Blue `oklch(0.45 0.15 240)`): White text `oklch(1 0 0)` - Ratio 9.2:1 ✓
  - Secondary (Light Blue `oklch(0.95 0.02 240)`): Dark Gray text `oklch(0.2 0.01 240)` - Ratio 15.8:1 ✓
  - Accent (Warm Orange `oklch(0.65 0.15 45)`): White text `oklch(1 0 0)` - Ratio 4.9:1 ✓

## Font Selection
Clean, modern sans-serif typography that conveys professionalism and clarity, using Inter for its excellent readability across digital platforms.

- **Typographic Hierarchy**: 
  - H1 (App Title): Inter Bold/32px/tight letter spacing
  - H2 (Section Headers): Inter SemiBold/24px/normal letter spacing  
  - H3 (Platform Names): Inter Medium/18px/normal letter spacing
  - Body Text: Inter Regular/16px/relaxed line height
  - Labels: Inter Medium/14px/normal letter spacing
  - Captions: Inter Regular/12px/loose letter spacing

## Animations
Subtle, purposeful animations that enhance usability without distraction - button hover states, smooth transitions between generation states, and gentle feedback animations for successful actions.

- **Purposeful Meaning**: Motion reinforces the content transformation workflow and provides clear feedback for user actions
- **Hierarchy of Movement**: Generation button gets primary animation focus, followed by platform selection feedback, then copy confirmations

## Component Selection
- **Components**: 
  - Card components for platform-specific post display
  - Textarea for content input with character counting
  - Checkbox components for platform selection with custom styling
  - Button variants for primary (Generate) and secondary (Copy) actions
  - Alert components for error states and success notifications
  - Badge components for character count indicators
- **Customizations**: 
  - Platform-specific color coding for post cards
  - Loading spinner overlay during AI generation
  - Animated check icons for successful copy actions
- **States**: 
  - Buttons: Disabled state for invalid input, loading state during generation
  - Inputs: Focus state with blue border, error state with red border
  - Checkboxes: Custom styling to match platform brand colors
- **Icon Selection**: 
  - Platform icons (LinkedIn, Instagram, X, Facebook) from phosphor-icons
  - Copy icon for post actions
  - Check icon for success states
  - Alert icons for error states
- **Spacing**: 
  - Container padding: p-6
  - Section gaps: space-y-6  
  - Card padding: p-4
  - Button spacing: px-4 py-2
- **Mobile**: 
  - Single column layout with full-width cards
  - Larger touch targets for platform selection
  - Optimized textarea sizing for mobile keyboards
  - Sticky generate button on mobile for easy access