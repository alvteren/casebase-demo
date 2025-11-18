# UI Components Library

This library contains reusable UI components for the Casebase Demo application.

## Components

### Message
A component for displaying chat messages with support for:
- User and assistant message styling
- Context sources display
- Token usage information
- Timestamp display

### Snackbar
A notification component for displaying transient messages with:
- Auto-dismiss functionality
- Success styling
- Close button

## Usage

```tsx
import { Message, Snackbar } from '@casebase-demo/ui-components';

// Use Message component
<Message
  message={message}
  index={index}
  showContext={showContext}
  onToggleContext={handleToggle}
/>

// Use Snackbar component
<Snackbar
  message="Success message"
  open={isOpen}
  onClose={handleClose}
  duration={3000}
/>
```

## Building

```bash
nx build ui-components
```
