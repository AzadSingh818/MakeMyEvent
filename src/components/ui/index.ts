// src/components/ui/index.ts - FIXED: Removed duplicate Separator export
// Export all UI components from a single file for easier imports

// Form Components
export { Button, buttonVariants } from './button'
export { Input } from './input'
export { Label } from './label'
export { Textarea } from './textarea'
export { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
} from './select'

// Layout Components
export { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from './card'

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from './dialog'

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from './table'

// Navigation Components
export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from './tabs'

// Progress Components
export { Progress } from './progress'

// Badge Components
export { Badge, badgeVariants } from './badge'

// Separator Component
export { Separator } from './separator'

// Loading Components
export {
  LoadingSpinner,
  PageLoading,
  LoadingButton,
  Skeleton,
  CardSkeleton,
  TableRowSkeleton,
  ListItemSkeleton,
  FormFieldSkeleton,
  StatsSkeleton,
  ContentLoading,
  LoadingOverlay,
} from './loading'

// Alert Components
export {
  Alert,
  AlertTitle,
  AlertDescription,
  SuccessAlert,
  ErrorAlert,
  WarningAlert,
  InfoAlert,
  ToastNotification,
  InlineAlert,
} from './alert'