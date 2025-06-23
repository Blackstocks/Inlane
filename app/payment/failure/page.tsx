'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function FailurePage() {
  return (
    <div className="p-8 text-center">
      <h1 className="text-red-600 text-2xl font-bold">Payment Failed!</h1>
      <p className="mt-4">There was an issue processing your payment.</p>
    </div>
  );
}
