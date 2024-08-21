"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "@/lib/firebaseClient";
import Link from "next/link";
import { AuthCard } from "@/components/AuthCard";
import { AvatarUpload } from "@/components/AvatarUpload";
import { InputField } from "@/components/InputField";
import { PasswordField } from "@/components/PasswordField";
import ChatIllustration from "@/components/common/ChatIllustration";
import { language_facts, languages } from "@/constants";

export default function SignupPage() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    username: "",
    fullName: "",
    preferredLang: "",
  });
  const searchParams = useSearchParams();
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [passwordsMatch, setPasswordsMatch] = useState(true);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const router = useRouter();
  const [showFact, setShowFact] = useState(false)

  useEffect(() => {
    setPasswordsMatch(form.password === form.confirmPassword);
  }, [form.password, form.confirmPassword]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAvatar(e.target.files[0]);
      setAvatarPreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const genLanguageFact = (preferredLangCode: string): string => {
    const facts = language_facts[preferredLangCode as keyof typeof language_facts];
    const randomIndex = Math.floor(Math.random() * facts.length);
    return facts[randomIndex];
  };
  

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
    e.preventDefault();
    if (!isFormValid()) return;

    setErrors({});
    setIsLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );
      const user = userCredential.user;

      let avatarUrl = null;
      if (avatar) {
        const avatarRef = ref(storage, `avatars/${user.uid}`);
        await uploadBytes(avatarRef, avatar);
        avatarUrl = await getDownloadURL(avatarRef);
      }

      await updateProfile(user, {
        displayName: form.username,
        photoURL: avatarUrl,
      });

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: form.email,
        username: form.username,
        fullName: form.fullName,
        preferredLang: form.preferredLang,
        avatar: avatarUrl,
        createdAt: new Date().toISOString(),
      });

      setIsRedirecting(true);

      const callbackUrl = searchParams.get("callbackUrl");
      const invitedChatId = searchParams.get("token");

      if (callbackUrl) {
        const encodedCallbackUrl = encodeURIComponent(callbackUrl);
        router.push(`/signin?callbackUrl=${encodedCallbackUrl}`);
      } else if (invitedChatId) {
        router.push(`/accept-invite?token=${invitedChatId}`);
      } else {
        setShowFact(true);
        setTimeout(() => {
          setShowFact(false);
          router.push("/signin");
        }, 5000); 
      }
    } catch (error) {
      setErrors({ general: "Failed to create an account. Please try again." });
      console.error("Error during signup:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <AuthCard className="w-[70%]">
        {showFact ? <div className="flex p-20 flex-col w-full items-center justify-center">
      <h2 className="text-4xl md:text-7xl my-5">Did You Know?</h2>
      <p className="text-2xl text-gray-400 mt-20 text-center">
          {genLanguageFact(form.preferredLang)}
      </p>
    </div> : <>
        <div className="w-full md:w-1/2 p-4">
          <h1 className="text-2xl md:text-3xl font-bold mb-2 text-center text-base-content">
            Create an Account
          </h1>
          <p className="text-sm md:text-base text-base-content/70 mb-6 text-center">
            Join us to start chatting across languages.
          </p>

          <AvatarUpload
            avatarPreview={avatarPreview}
            handleFileChange={handleFileChange}
          />

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex md:flex-row justify-between">
              <InputField
                className="flex-1"
                label="Email address"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="example@mail.com"
                error={errors.email}
              />
              <InputField
                className="flex-1"
                label="Username"
                name="username"
                type="text"
                value={form.username}
                onChange={handleChange}
                placeholder="johndoe"
                error={errors.username}
              />
            </div>
            <InputField
              label="Full Name"
              name="fullName"
              type="text"
              value={form.fullName}
              onChange={handleChange}
              placeholder="John Doe"
              error={errors.fullName}
            />
            <div className="flex md:flex-row justify-between">
              <PasswordField
                label="Password"
                name="password"
                value={form.password}
                onChange={handleChange}
                error={errors.password}
              />
              <PasswordField
                label="Confirm Password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                error={!passwordsMatch ? "Passwords do not match" : undefined}
              />
            </div>

            {/* Preferred Language dropdown */}
            <div>
              <label className="label pl-0">
                <span className="label-text text-sm md:text-base text-base-content/80">
                  Preferred Language
                </span>
              </label>
              <select
                name="preferredLang"
                value={form.preferredLang}
                onChange={handleChange}
                className={`select select-bordered w-full bg-base-100 text-sm md:text-base ${
                  errors.preferredLang ? "select-error" : ""
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

            {/* Terms and conditions checkbox */}
            <div className="flex items-center mt-4">
              <input
                type="checkbox"
                name="terms"
                checked={termsAccepted}
                onChange={() => setTermsAccepted(!termsAccepted)}
                className="checkbox checkbox-primary"
              />
              <span className="ml-2 text-sm md:text-base text-base-content/80">
                I accept the{" "}
                <Link href="/terms" className="text-primary underline">
                  Terms and Conditions
                </Link>
              </span>
            </div>

            {errors.general && (
              <div className="alert alert-error">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="stroke-current shrink-0 h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>{errors.general}</span>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary w-full text-sm md:text-base"
              disabled={isLoading || !isFormValid()}
            >
              {isLoading ? (
                <>
                  <span className="loading loading-spinner"></span>
                  Creating account...
                </>
              ) : (
                "Sign Up"
              )}
            </button>
          </form>

          <p className="text-sm md:text-base text-base-content/70 mt-4 text-center">
            Already have an account?{" "}
            <Link href="/signin" className="text-primary underline">
              Sign In
            </Link>
          </p>
        </div>

        <div className="w-full md:w-1/2 hidden md:flex flex-col items-center justify-center">
          <ChatIllustration />
        </div>
        </>}
      </AuthCard>
    </div>
  );
}
