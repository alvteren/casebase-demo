# UI Components Library

This library contains reusable UI components built with shadcn/ui and Tailwind CSS.

## Available Components

### shadcn/ui Components

- **Button** - Versatile button component with multiple variants
- **Input** - Styled input field
- **Card** - Container component with header, content, and footer
- **Dialog** - Modal dialog component
- **ScrollArea** - Custom scrollable area

### Custom Components

- **Message** - Chat message component
- **Snackbar** - Toast notification component

## Usage

```tsx
import { Button, Input, Card, Dialog } from '@casebase-demo/ui-components';

// Button with variants
<Button variant="default">Click me</Button>
<Button variant="outline">Outline</Button>
<Button variant="destructive">Delete</Button>

// Input
<Input type="text" placeholder="Enter text..." />

// Card
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    Content here
  </CardContent>
</Card>

// Dialog
<Dialog>
  <DialogTrigger>Open</DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>Dialog description</DialogDescription>
    </DialogHeader>
  </DialogContent>
</Dialog>
```

## Adding New Components

To add new shadcn/ui components:

1. Install the required Radix UI dependencies:
   ```bash
   npm install @radix-ui/react-[component] --legacy-peer-deps
   ```

2. Copy the component code from [shadcn/ui](https://ui.shadcn.com/docs/components)

3. Place it in `libs/ui-components/src/lib/[component-name].tsx`

4. Export it from `libs/ui-components/src/index.ts`

## Utilities

The library includes a `cn` utility function for merging Tailwind classes:

```tsx
import { cn } from '@casebase-demo/ui-components';

<div className={cn('base-class', condition && 'conditional-class')} />
```
