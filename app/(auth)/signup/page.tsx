"use client";
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { auth, db, storage } from '@/lib/firebaseClient'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from "framer-motion";
import gIcon from "@/app/assets/img/g-icon.png";
import ChatIllustration from "@/components/common/ChatIllustration";

const languages = [
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'French' },
  { code: 'es', name: 'Spanish' },
  { code: 'ar', name: 'Arabic' },
  { code: 'sw', name: 'Swahili' },
]

export default function SignupPage() {
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    fullName: '',
    preferredLang: '',
  })
  const [avatar, setAvatar] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordsMatch, setPasswordsMatch] = useState(true)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setPasswordsMatch(form.password === form.confirmPassword);
  }, [form.password, form.confirmPassword]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAvatar(e.target.files[0])
      setAvatarPreview(URL.createObjectURL(e.target.files[0]))
    }
  }

  const isFormValid = () => {
    return (
      form.email &&
      form.username &&
      form.fullName &&
      form.password &&
      form.confirmPassword &&
      passwordsMatch &&
      termsAccepted
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid()) return;
  
    setErrors({})
    setIsLoading(true)
  
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password)
      const user = userCredential.user
  
      let avatarUrl = null
      if (avatar) {
        const avatarRef = ref(storage, `avatars/${user.uid}`)
        await uploadBytes(avatarRef, avatar)
        avatarUrl = await getDownloadURL(avatarRef)
      }
  
      await updateProfile(user, {
        displayName: form.username,
        photoURL: avatarUrl
      })
  
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: form.email,
        username: form.username,
        fullName: form.fullName,
        preferredLang: form.preferredLang,
        avatar: avatarUrl,
        createdAt: new Date().toISOString()
      })
  
      const { callbackUrl, invitedChatId } = router.query
  
      if (callbackUrl && invitedChatId) {
        router.push(`/accept-invite?token=${invitedChatId}`)
      } else {
        router.push('/signin')
      }
    } catch (error) {
      setErrors({ general: 'Failed to create an account. Please try again.' })
      console.error('Error during signup:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full md:w-1/2 p-4 md:p-8 flex flex-col justify-center items-center"
      >
        <div className="w-full max-w-md">
          <h1 className="text-2xl md:text-3xl font-bold mb-2 text-center">
            Create an Account
          </h1>
          <p className="text-sm md:text-base text-gray-500 mb-6 md:mb-8 text-center">
            Join us to start chatting across languages.
          </p>

          <button className="card bg-base-100 shadow-sm mb-6 w-full cursor-pointer hover:bg-gray-100 transition-colors flex-row justify-center">
            <div className="card-body p-3 md:p-4 flex-row items-center justify-center text-center">
              <Image
                src={gIcon}
                width={16}
                height={16}
                alt="Google"
                className="mr-2 text-center"
              />
              <span className="text-sm md:text-base text-center">
                Sign up with Google
              </span>
            </div>
          </button>

          <p className="text-center text-gray-400 text-sm md:text-base mb-6">
            or
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label pl-0">
                <span className="label-text text-sm md:text-base text-gray-600">
                  Email address
                </span>
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="example@mail.com"
                className={`input input-bordered w-full bg-white text-sm md:text-base ${
                  errors.email ? "input-error" : ""
                }`}
              />
              {errors.email && (
                <p className="text-error text-xs mt-1">{errors.email}</p>
              )}
            </div>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="label pl-0">
                  <span className="label-text text-sm md:text-base text-gray-600">
                    Username
                  </span>
                </label>
                <input
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="johndoe"
                  className={`input input-bordered w-full bg-white text-sm md:text-base ${
                    errors.username ? "input-error" : ""
                  }`}
                />
                {errors.username && (
                  <p className="text-error text-xs mt-1">{errors.username}</p>
                )}
              </div>
              <div className="flex-1">
                <label className="label pl-0">
                  <span className="label-text text-sm md:text-base text-gray-600">
                    Full Name
                  </span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className={`input input-bordered w-full bg-white text-sm md:text-base ${
                    errors.fullName ? "input-error" : ""
                  }`}
                />
                {errors.fullName && (
                  <p className="text-error text-xs mt-1">{errors.fullName}</p>
                )}
              </div>
            </div>
            <div>
              <label className="label pl-0">
                <span className="label-text text-sm md:text-base text-gray-600">
                  Password
                </span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`input input-bordered w-full bg-white pr-10 text-sm md:text-base ${
                    errors.password ? "input-error" : ""
                  }`}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5 text-gray-400"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.774 3.162 10.066 7.5a10.464 10.464 0 01-4.524 5.527M8.22 8.22l10.56 10.56M15.782 15.78A3.75 3.75 0 118.22 8.22"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5 text-gray-400"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.458 12C3.732 7.943 7.522 5 12 5c4.478 0 8.268 2.943 9.542 7-.37 1.178-.94 2.268-1.684 3.203M4.795 4.795a15.978 15.978 0 0111.325-2.105M2.344 2.344l19.312 19.312"
                      />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-error text-xs mt-1">{errors.password}</p>
              )}
            </div>
            <div>
              <label className="label pl-0">
                <span className="label-text text-sm md:text-base text-gray-600">
                  Confirm Password
                </span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`input input-bordered w-full bg-white pr-10 text-sm md:text-base ${
                    !passwordsMatch ? "input-error" : ""
                  }`}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5 text-gray-400"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.774 3.162 10.066 7.5a10.464 10.464 0 01-4.524 5.527M8.22 8.22l10.56 10.56M15.782 15.78A3.75 3.75 0 118.22 8.22"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5 text-gray-400"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.458 12C3.732 7.943 7.522 5 12 5c4.478 0 8.268 2.943 9.542 7-.37 1.178-.94 2.268-1.684 3.203M4.795 4.795a15.978 15.978 0 0111.325-2.105M2.344 2.344l19.312 19.312"
                      />
                    </svg>
                  )}
                </button>
              </div>
              {!passwordsMatch && (
                <p className="text-error text-xs mt-1">
                  Passwords do not match
                </p>
              )}
            </div>

            <div>
              <label className="label pl-0">
                <span className="label-text text-sm md:text-base text-gray-600">
                  Preferred Language
                </span>
              </label>
              <select
                name="preferredLang"
                value={form.preferredLang}
                onChange={handleChange}
                className={`input input-bordered w-full bg-white text-sm md:text-base ${
                  errors.preferredLang ? "input-error" : ""
                }`}
              >
                <option value="">Select a language</option>
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
              {errors.preferredLang && (
                <p className="text-error text-xs mt-1">
                  {errors.preferredLang}
                </p>
              )}
            </div>

            <div>
              <label className="label pl-0">
                <span className="label-text text-sm md:text-base text-gray-600">
                  Avatar (optional)
                </span>
              </label>
              <input
                type="file"
                name="avatar"
                onChange={handleFileChange}
                className={`input input-bordered w-full bg-white text-sm md:text-base ${
                  errors.avatar ? "input-error" : ""
                }`}
              />
              {avatarPreview && (
                <img
                  src={avatarPreview}
                  alt="Avatar Preview"
                  className="mt-2 w-24 h-24 rounded-full object-cover"
                />
              )}
              {errors.avatar && (
                <p className="text-error text-xs mt-1">{errors.avatar}</p>
              )}
            </div>

            <div className="flex items-center mt-4">
              <input
                type="checkbox"
                name="terms"
                checked={termsAccepted}
                onChange={() => setTermsAccepted(!termsAccepted)}
                className="checkbox checkbox-primary"
              />
              <span className="ml-2 text-sm md:text-base text-gray-600">
                I accept the{" "}
                <Link href="/terms" className="text-blue-500 underline">
                  Terms and Conditions
                </Link>
              </span>
            </div>

            {errors.general && (
              <p className="text-error text-xs mt-1">{errors.general}</p>
            )}

            <button
              type="submit"
              className={`btn btn-primary w-full mt-6 md:mt-8 ${
                isLoading ? "loading" : ""
              }`}
              disabled={isLoading || !isFormValid()}
            >
              {isLoading ? "Creating account..." : "Sign Up"}
            </button>
          </form>

          <p className="text-sm md:text-base text-gray-500 mt-4 text-center">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-500 underline">
              Log In
            </Link>
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full md:w-1/2 bg-indigo-100 p-8 hidden md:flex flex-col items-center justify-center"
      >
        <ChatIllustration />
      </motion.div>
    </div>
  );
}
