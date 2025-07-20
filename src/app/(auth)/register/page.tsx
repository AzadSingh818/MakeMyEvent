'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  LoadingButton,
  ErrorAlert,
  SuccessAlert,
  InlineAlert
} from '@/components/ui'
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  User, 
  Phone,
  Calendar,
  ArrowLeft,
  Chrome,
  Building
} from 'lucide-react'

// ✅ LOCAL UserRole enum (no external import)
enum UserRole {
  ORGANIZER = 'ORGANIZER',
  EVENT_MANAGER = 'EVENT_MANAGER',
  FACULTY = 'FACULTY',
  DELEGATE = 'DELEGATE',
  HALL_COORDINATOR = 'HALL_COORDINATOR',
  SPONSOR = 'SPONSOR',
  VOLUNTEER = 'VOLUNTEER',
  VENDOR = 'VENDOR'
}

// Registration form validation schema
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  role: z.nativeEnum(UserRole),
  institution: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: 'You must agree to the terms and conditions'
  })
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

type RegisterFormData = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  
  const router = useRouter()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      agreeToTerms: false
    }
  })

  const selectedRole = watch('role')

  // Handle form submission
  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)
    setError('')

    try {
      console.log('🔄 Submitting registration:', { 
        email: data.email, 
        role: data.role,
        institution: data.institution 
      })

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email.toLowerCase(),
          phone: data.phone,
          role: data.role,
          institution: data.institution,
          password: data.password
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('❌ Registration failed:', result)
        throw new Error(result.message || 'Registration failed')
      }

      console.log('✅ Registration successful:', result)
      setSuccess(true)
      
      // Auto-login after successful registration
      setTimeout(async () => {
        console.log('🔄 Attempting auto-login...')
        const signInResult = await signIn('credentials', {
          email: data.email.toLowerCase(),
          password: data.password,
          redirect: false
        })

        if (signInResult?.ok) {
          console.log('✅ Auto-login successful, redirecting...')
          const roleRoutes: Record<string, string> = {
            'ORGANIZER': '/organizer',
            'EVENT_MANAGER': '/event-manager',
            'FACULTY': '/faculty',
            'DELEGATE': '/delegate',
            'HALL_COORDINATOR': '/hall-coordinator',
            'SPONSOR': '/sponsor',
            'VOLUNTEER': '/volunteer',
            'VENDOR': '/vendor'
          }
          
          const redirectUrl = roleRoutes[data.role] || '/delegate'
          router.push(redirectUrl)
        } else {
          console.log('❌ Auto-login failed, redirecting to login page')
          router.push('/login')
        }
      }, 2000)

    } catch (err: any) {
      console.error('❌ Registration error:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle Google sign-in
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true)
    setError('')

    try {
      console.log('🔄 Attempting Google sign-in...')
      await signIn('google', { 
        callbackUrl: '/delegate',
        redirect: true 
      })
    } catch (err) {
      console.error('❌ Google sign-in error:', err)
      setError('Failed to sign in with Google')
      setIsGoogleLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-0 shadow-xl">
          <CardContent className="pt-6">
            <SuccessAlert title="Registration Successful!">
              Your account has been created successfully. You will be redirected to your dashboard shortly.
            </SuccessAlert>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        
        <div>
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>

        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center pb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
            <CardDescription>
              Join the Conference Management platform
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            
            {error && (
              <ErrorAlert onClose={() => setError('')}>
                {error}
              </ErrorAlert>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Dr. John Doe"
                    className="pl-10"
                    {...register('name')}
                  />
                </div>
                {errors.name && (
                  <InlineAlert type="error" message={errors.name.message || ''} />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    className="pl-10"
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <InlineAlert type="error" message={errors.email.message || ''} />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    className="pl-10"
                    {...register('phone')}
                  />
                </div>
                {errors.phone && (
                  <InlineAlert type="error" message={errors.phone.message || ''} />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select onValueChange={(value) => setValue('role', value as UserRole)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ORGANIZER">Conference Organizer</SelectItem>
                    <SelectItem value="EVENT_MANAGER">Event Manager</SelectItem>
                    <SelectItem value="FACULTY">Faculty/Speaker</SelectItem>
                    <SelectItem value="DELEGATE">Delegate/Attendee</SelectItem>
                    <SelectItem value="HALL_COORDINATOR">Hall Coordinator</SelectItem>
                    <SelectItem value="SPONSOR">Sponsor</SelectItem>
                    <SelectItem value="VOLUNTEER">Volunteer</SelectItem>
                    <SelectItem value="VENDOR">Vendor</SelectItem>
                  </SelectContent>
                </Select>
                {errors.role && (
                  <InlineAlert type="error" message={errors.role.message || ''} />
                )}
              </div>

              {(selectedRole === 'FACULTY' || selectedRole === 'ORGANIZER' || selectedRole === 'EVENT_MANAGER') && (
                <div className="space-y-2">
                  <Label htmlFor="institution">Institution/Organization</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="institution"
                      type="text"
                      placeholder="University/Hospital/Organization"
                      className="pl-10"
                      {...register('institution')}
                    />
                  </div>
                  {errors.institution && (
                    <InlineAlert type="error" message={errors.institution.message || ''} />
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a strong password"
                    className="pl-10 pr-12"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <InlineAlert type="error" message={errors.password.message || ''} />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    className="pl-10 pr-12"
                    {...register('confirmPassword')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <InlineAlert type="error" message={errors.confirmPassword.message || ''} />
                )}
              </div>

              <div className="flex items-start space-x-2">
                <input
                  id="agreeToTerms"
                  type="checkbox"
                  className="rounded mt-1"
                  {...register('agreeToTerms')}
                />
                <Label htmlFor="agreeToTerms" className="text-sm leading-relaxed">
                  I agree to the{' '}
                  <Link href="/terms" className="text-blue-600 hover:text-blue-700 underline">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-blue-600 hover:text-blue-700 underline">
                    Privacy Policy
                  </Link>
                </Label>
              </div>
              {errors.agreeToTerms && (
                <InlineAlert type="error" message={errors.agreeToTerms.message || ''} />
              )}

              <LoadingButton
                type="submit"
                loading={isLoading}
                className="w-full"
              >
                Create Account
              </LoadingButton>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-gray-800 px-2 text-gray-500">Or</span>
              </div>
            </div>

            <LoadingButton
              type="button"
              loading={isGoogleLoading}
              onClick={handleGoogleSignIn}
              className="w-full"
            >
              <Chrome className="w-4 h-4 mr-2" />
              Continue with Google
            </LoadingButton>

            <div className="text-center text-sm">
              <span className="text-gray-600 dark:text-gray-400">Already have an account? </span>
              <Link 
                href="/login" 
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
              >
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}