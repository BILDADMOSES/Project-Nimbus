"use client"

import { useRouter } from 'next/navigation';
import TermsOfService from "@/components/TermsOfService";
import { ArrowLeft } from 'lucide-react';

export default function TermsAndConditionsPage() {
  const router = useRouter();

  const handleGoBack = () => {
    router.back();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      
      <TermsOfService />
      <button 
        onClick={handleGoBack}
        className="btn btn-primary mb-4 flex items-center hover:transition-colors duration-200 mt-4"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Back
      </button>
    </div>
  );
}