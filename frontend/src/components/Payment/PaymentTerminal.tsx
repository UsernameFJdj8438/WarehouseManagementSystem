import React, { useState, useEffect } from 'react';
import { Card } from '../UI/Card';
import { Button } from '../UI/Button';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import api from '../../services/api';
import { useAuth } from '../../features/auth/context/AuthContext';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_PLACEHOLDER');

interface PaymentTerminalProps {
  isOpen: boolean;
  onClose: () => void;
  installment: {
    paymentID: number;
    amount: number;
  } | null;
  onSuccess: () => void;
}

const CheckoutForm: React.FC<{ 
  installment: { paymentID: number; amount: number }; 
  onClose: () => void;
  onSuccess: () => void;
}> = ({ installment, onClose, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { token } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  useEffect(() => {
    const createIntent = async () => {
      try {
        const response = await api.post(`/api/Payment/create-intent/${installment.paymentID}`, {});
        setClientSecret(response.data.clientSecret);
      } catch (err) {
        console.error("Failed to create payment intent", err);
        setError("Could not initialize payment. Please try again.");
      }
    };

    createIntent();
  }, [installment.paymentID, token]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) return;

    setProcessing(true);
    setError(null);

    // stripe confirmation
    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement)!,
      },
    });

    if (result.error) {
      setError(result.error.message || "An unexpected error occurred.");
      setProcessing(false);
    } else {
      if (result.paymentIntent.status === 'succeeded') {
        try {
          await api.post(`/api/Payment/confirm/${installment.paymentID}`);
          onSuccess();
        } catch (confirmErr) {
          console.error("Database update failed", confirmErr);
          setError("Stripe payment succeeded, but our system failed to update. Please refresh the page.");
          setProcessing(false);
        }
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-8 space-y-6">
      <div className="flex justify-between items-end pb-6 border-b border-base-border">
        <div>
          <p className="text-xs font-bold text-muted-text uppercase tracking-widest mb-1">Installment</p>
          <p className="text-lg font-black text-card-title">#{installment.paymentID}</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-muted-text uppercase tracking-widest mb-1">Amount Due</p>
          <p className="text-3xl font-black text-primary-600">${installment.amount}</p>
        </div>
      </div>

      {/* stripe card lement thing  */}
      <div className="space-y-4">
        <label className="text-[10px] font-black text-muted-text uppercase tracking-wider mb-2 block">Card Information</label>
        <div className="p-4 bg-page border-2 border-base-border rounded-xl">
          <CardElement options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#111827',
                '::placeholder': { color: '#9ca3af' },
              },
            },
          }} />
        </div>
        {error && <p className="text-red-500 text-xs font-bold uppercase tracking-tight">{error}</p>}
      </div>

      <Button 
        type="submit"
        disabled={!stripe || processing || !clientSecret}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 rounded-2xl shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
      >
        {processing ? (
          <>
            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            processing...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            authorize payment
          </>
        )}
      </Button>

      <div className="flex items-center justify-center gap-2 grayscale opacity-50">
        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Powered by</span>
        <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" alt="Stripe" className="h-3" />
      </div>
    </form>
  );
};

export const PaymentTerminal: React.FC<PaymentTerminalProps> = ({ isOpen, onClose, installment, onSuccess }) => {
  if (!isOpen || !installment) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
      <div className="w-full max-w-md animate-in fade-in zoom-in duration-200">
        <Card className="relative overflow-hidden border-none shadow-2xl">

          <div className="bg-indigo-600 px-8 py-6 text-white">
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 text-indigo-200 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-200 mb-1">Stripe Secure Terminal</p>
            <h3 className="text-2xl font-black tracking-tight">Complete Payment</h3>
          </div>

          <Elements stripe={stripePromise}>
            <CheckoutForm installment={installment} onClose={onClose} onSuccess={onSuccess} />
          </Elements>
        </Card>
      </div>
    </div>
  );
};
