import { useState } from 'react';
import axios from 'axios';
import {SignUpForm, SignUpError} from '@/types';


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

  const validateForm = () => {
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
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await axios.post('/api/auth/sign-up', {
        email: form.email,
        name: `${form.firstName} ${form.lastName}`,
        password: form.password,
        preferredLanguage: 'en', // Default to English
      });
      
      // language-selection is next
      // Handle successful sign up redirect to setting up the chat room
      console.log('Sign up successful', response.data);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        setErrors({ general: error.response.data.message || 'Failed to sign up. Please try again.' });
      } else {
        setErrors({ general: 'An unexpected error occurred. Please try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return { form, handleChange, handleSubmit, errors, isLoading };
};