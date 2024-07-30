import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase/firebaseClient';
import axios from 'axios';
import { SignUpForm, SignUpError } from '@/types';

export const useSignUp = () => {
  const [form, setForm] = useState<SignUpForm>({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<SignUpError>({});
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const validateForm = (): boolean => {
    const newErrors: SignUpError = {};
    if (!form.email) newErrors.email = 'Email is required';
    if (!form.firstName) newErrors.firstName = 'First name is required';
    if (!form.lastName) newErrors.lastName = 'Last name is required';
    if (!form.password) newErrors.password = 'Password is required';
    if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prevForm => ({ ...prevForm, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);

    try {
      console.log('Starting user creation process');
      
      // Create user in Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
      const user = userCredential.user;
      console.log('User created in Firebase:', user.uid);

      // Update user profile in Firebase
      await updateProfile(user, {
        displayName: `${form.firstName} ${form.lastName}`,
      });
      console.log('User profile updated in Firebase');

      // Get the ID token
      const idToken = await user.getIdToken(true);  // Force refresh
      console.log('ID Token retrieved:', idToken.substring(0, 10) + '...');  // Log first 10 characters for security

      // Create user in MongoDB
      const response = await axios.post('/api/auth/create-user', 
        {
          firebaseUid: user.uid,
          email: form.email,
          firstName: form.firstName,
          lastName: form.lastName,
          preferredLanguage: 'en', // Default to English
        },
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );

      console.log('API Response:', response.data);

      router.push('/sign-in');
    } catch (error: any) {
      console.error('Sign up error:', error);
      if (axios.isAxiosError(error)) {
        console.error('Axios error:', error.response?.data);
      }
      if (error.code === 'auth/email-already-in-use') {
        setErrors({ email: 'Email is already in use' });
      } else if (error.code === 'auth/weak-password') {
        setErrors({ password: 'Password is too weak' });
      } else {
        setErrors({ general: 'Failed to sign up. Please try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return { form, handleChange, handleSubmit, errors, isLoading };
};