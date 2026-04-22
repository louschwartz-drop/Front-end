"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import CheckoutForm from "@/components/user/CheckoutForm";
import Button from "@/components/ui/Button";
import { toast } from "react-toastify";
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

import { pricingService } from "@/lib/api/user/pricing";
import { paymentService } from "@/lib/api/user/payments";
import { Check, X, Tag } from "lucide-react";
import userAuthStore from "@/store/userAuthStore";

export default function PaymentPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const campaignId = params.id;
  const planId = searchParams.get("plan");

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [plan, setPlan] = useState(null);
  const [clientSecret, setClientSecret] = useState("");
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState("");
  const [isSetupIntent, setIsSetupIntent] = useState(false);
  const [isFreeTransaction, setIsFreeTransaction] = useState(false);

  const { user } = userAuthStore();
  const userId = user?._id || user?.id;

  const [saveCard, setSaveCard] = useState(false);
  const [savedCards, setSavedCards] = useState([]);
  const [selectedCardId, setSelectedCardId] = useState("");
  const [useNewCard, setUseNewCard] = useState(false);

  useEffect(() => {
    if (!planId) {
      router.push(`/user/pricing/${campaignId}`);
      return;
    }

    // Wait until userId is loaded from the auth store before fetching plans and creating intent
    // This prevents sending an empty payload and creating ghost/duplicate intents
    if (!userId) return;

    loadPlan();
    loadSavedCards();
  }, [campaignId, planId, userId]);

  const loadSavedCards = async () => {
    try {
      const res = await paymentService.getCards(userId);
      if (res.success && Array.isArray(res.data)) {
        // Filter out duplicate cards by ID to prevent key React rendering errors
        // and avoid showing the same card multiple times visually
        const uniqueCardsMap = new Map();
        res.data.forEach(card => {
          if (card && card.id && !uniqueCardsMap.has(card.id)) {
            uniqueCardsMap.set(card.id, card);
          }
        });
        const uniqueCards = Array.from(uniqueCardsMap.values());

        setSavedCards(uniqueCards);
        const defaultCard = uniqueCards.find(c => c.isDefault);
        if (defaultCard) {
          setSelectedCardId(defaultCard.id);
        } else if (uniqueCards.length > 0) {
          setSelectedCardId(uniqueCards[0].id);
        } else {
          setUseNewCard(true);
        }
      }
    } catch (error) {
      console.error("Error loading saved cards:", error?.response?.data || error.message || error);
    }
  };

  const loadPlan = async () => {
    try {
      setLoading(true);
      const res = await pricingService.getPlan(planId);
      if (res.success) {
        const planData = res.data;
        
        // Redirect if plan is "Coming Soon"
        if (planData.isComingSoon) {
          toast.error("This plan is coming soon and cannot be purchased yet.");
          router.push(`/user/pricing/${campaignId}`);
          return;
        }

        setPlan(planData);
        // Pre-create payment intent when plan is loaded
        const piRes = await paymentService.createPaymentIntent(campaignId, planId, userId, saveCard);
        if (piRes.success) {
          setClientSecret(piRes.data.clientSecret);
          setIsSetupIntent(!!piRes.data.isSetupIntent);
          setIsFreeTransaction(!!piRes.data.isFreeTransaction);
        } else {
          toast.error(piRes.message || "Failed to initialize payment");
        }
      } else {
        toast.error("Failed to load plan details");
      }
    } catch (error) {
      console.error("Error loading plan:", error?.response?.data || error.message || error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPromo = async () => {
    if (!promoCodeInput.trim()) return;

    try {
      setIsApplyingPromo(true);
      setPromoError("");
      
      const res = await paymentService.validatePromo(promoCodeInput.trim(), planId);
      
      if (res.success) {
        setAppliedPromo(res.data);
        toast.success(`Promo code applied! Saved $${res.data.discountAmount.toFixed(2)}`);
        
        // RE-CREATE payment intent with the promo code to get discounted amount
        const piRes = await paymentService.createPaymentIntent(campaignId, planId, userId, saveCard, promoCodeInput.trim());
        if (piRes.success) {
          setClientSecret(piRes.data.clientSecret);
          setIsSetupIntent(!!piRes.data.isSetupIntent);
          setIsFreeTransaction(!!piRes.data.isFreeTransaction);
        } else {
          toast.error("Failed to update payment amount with promo");
        }
      } else {
        setPromoError(res.message || "Invalid promo code");
      }
    } catch (error) {
      setPromoError(error.response?.data?.message || "Failed to validate promo code");
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const handleRemovePromo = async () => {
    setAppliedPromo(null);
    setPromoCodeInput("");
    setPromoError("");
    
    // Reset payment intent to original amount
    const piRes = await paymentService.createPaymentIntent(campaignId, planId, userId, saveCard);
    if (piRes.success) {
      setClientSecret(piRes.data.clientSecret);
      setIsSetupIntent(!!piRes.data.isSetupIntent);
      setIsFreeTransaction(!!piRes.data.isFreeTransaction);
    }
  };

  const handlePaymentSuccess = async (paymentIntent) => {
    toast.success("Payment successful! Redirecting to your press releases...");

    // Refresh user data to update available releases count in sidebar
    await userAuthStore.getState().refreshUser();

    setTimeout(() => {
      router.push("/user/dashboard/press-releases");
    }, 1500);
  };

  const appearance = {
    theme: 'stripe',
    variables: {
      colorPrimary: '#0A5CFF',
    },
  };

  const options = {
    clientSecret,
    appearance,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="w-16 h-1 w-16 h-1 bg-primary rounded-full blur-xl"
          />
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] animate-pulse">Loading Secure Checkout</p>
        </div>
      </div>
    );
  }

  if (!plan) return null;
  console.log("Stripe Key:", process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
  return (
    <div className="min-h-screen flex flex-col items-center  ">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8"
      >
        {/* Left Column: Summary */}
        <div className="lg:col-span-5 space-y-6">
          <button
            onClick={() => router.push(`/user/pricing/${campaignId}`)}
            className="group flex items-center gap-2 text-gray-500 hover:text-primary transition-all font-medium mb-4"
          >
            <div className="p-2 rounded-full bg-white border border-gray-200 group-hover:bg-primary group-hover:border-primary group-hover:text-white transition-all shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </div>
            Back to Pricing
          </button>

          <div className="bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100/50 p-2 sm:p-8 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>

            <h2 className="text-sm font-bold text-primary uppercase tracking-widest mb-6">Order Summary</h2>

            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-md sm:text-2xl font-black text-gray-900 leading-tight">
                    {plan.name} Package
                  </h3>
                  <p className="text-gray-500 text-sm mt-1">{plan.releasesCount} Press Release{plan.releasesCount > 1 ? 's' : ''}</p>
                </div>
                <div className="text-right">
                  <span className="text-md sm:text-2xl font-black text-primary">${plan.price.toFixed(2)}</span>
                </div>
              </div>

              <div className="bg-gray-50/50 rounded-2xl p-4 space-y-2.5">
                {plan.features?.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2.5 text-xs text-gray-600 font-medium">
                    <div className="w-4 h-4 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0">
                      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    {feature}
                  </div>
                ))}
              </div>
            </div>

              <div className="space-y-3 pt-6 border-t border-gray-100">
                <div className="flex justify-between text-gray-500 text-sm">
                  <span>Subtotal</span>
                  <span>${plan.price.toFixed(2)}</span>
                </div>

                {appliedPromo && (
                  <div className="flex justify-between text-green-600 text-sm font-medium animate-in fade-in slide-in-from-top-1">
                    <div className="flex items-center gap-1.5">
                      <button onClick={handleRemovePromo} className="hover:text-red-500 transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <span>Discount ({appliedPromo.code})</span>
                    </div>
                    <span>-${appliedPromo.discountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="pt-2">
                  {!appliedPromo ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Promo Code"
                          value={promoCodeInput}
                          onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                          className={`w-full min-w-0 flex-1 px-3 py-2 bg-gray-50 border ${promoError ? 'border-red-300 ring-4 ring-red-50' : 'border-gray-200'} rounded-xl text-sm font-bold uppercase transition-all outline-none focus:border-primary`}
                        />
                        <button
                          onClick={handleApplyPromo}
                          disabled={isApplyingPromo || !promoCodeInput.trim()}
                          className="px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-all disabled:opacity-50 whitespace-nowrap flex-shrink-0"
                        >
                          {isApplyingPromo ? "..." : "Apply"}
                        </button>
                      </div>
                      {promoError && <p className="text-[10px] text-red-500 font-bold ml-1">{promoError}</p>}
                    </div>
                  ) : (
                  <div className="group relative flex items-center justify-between bg-green-50/50 border-2 border-dashed border-green-200 p-2 sm:p-3 rounded-xl animate-in zoom-in-95 duration-200 min-w-0">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 overflow-hidden">
                      <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg text-green-600 flex-shrink-0">
                        <Tag className="w-3 h-3 sm:w-4 sm:h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                          <span className="text-[10px] sm:text-xs font-black text-green-700 uppercase tracking-wider truncate max-w-[80px] sm:max-w-[200px]">{appliedPromo.code}</span>
                          <span className="text-[9px] sm:text-[10px] font-bold bg-green-600 text-white px-1 sm:px-1.5 py-0.5 rounded whitespace-nowrap">
                            {appliedPromo.discountType === 'percentage' ? `${appliedPromo.discountValue}%` : `$${appliedPromo.discountValue}`} OFF
                          </span>
                        </div>
                        <p className="text-[8px] sm:text-[9px] text-green-600/70 font-bold uppercase tracking-tighter mt-0.5 truncate">Discount applied successfully</p>
                      </div>
                    </div>
                    <button
                      onClick={handleRemovePromo}
                      className="p-1.5 sm:p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all rounded-lg flex-shrink-0"
                      title="Remove promo code"
                    >
                      <X className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                )}
                </div>

                <div className="flex justify-between items-center pt-3 mt-3 border-t-2 border-dashed border-gray-100">
                  <span className="text-lg font-bold text-gray-900">Total Amount</span>
                  <div className="text-right">
                    <div className="text-md sm:text-3xl font-black text-primary leading-none">
                      ${(appliedPromo ? appliedPromo.finalPrice : plan.price).toFixed(2)}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-tighter">One-time payment</p>
                  </div>
                </div>
              </div>
            </div>

          <div className="bg-primary/5 rounded-2xl p-2 sm:p-6 border border-primary/10">
            <div className="flex gap-4">
              <div className="p-2 sm:p-3 max-h-12 bg-white rounded-xl shadow-sm flex items-center justify-center">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Secure Stripe Payment</h4>
                <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">
                  Your data is encrypted and secure. We do not store your full card details.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7">
          <div className="bg-white rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.06)] border border-gray-100/50 p-2 sm:p-8 h-full flex flex-col">
            <div className="mb-8 px-2 sm:px-0">
              <h1 className="text-lg sm:text-3xl font-black text-gray-900">Payment Details</h1>
              <p className="text-gray-500 mt-2 font-medium text-sm sm:text-base">
                {savedCards.length > 0 ? "Choose a saved card or use a new one." : "Enter your card information below to proceed."}
              </p>
            </div>

            <div className="flex-1 space-y-6">
              {savedCards.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Saved Methods</p>
                  <div className="grid grid-cols-1 gap-3">
                    {savedCards.map(card => (
                      <button
                        key={card.id}
                        onClick={() => {
                          setSelectedCardId(card.id);
                          setUseNewCard(false);
                        }}
                        className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${!useNewCard && selectedCardId === card.id ? 'border-primary bg-primary/5 ring-4 ring-primary/5' : 'border-gray-100 hover:border-gray-200 bg-white'}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-8 rounded-lg flex items-center justify-center border ${!useNewCard && selectedCardId === card.id ? 'bg-white border-primary/20' : 'bg-gray-50 border-gray-100'}`}>
                            <span className="text-[10px] font-black uppercase text-gray-600">{card.card.brand}</span>
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-bold text-gray-900">•••• {card.card.last4}</p>
                            <p className="text-[10px] text-gray-400 font-medium">Expires {card.card.exp_month}/{card.card.exp_year}</p>
                          </div>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${!useNewCard && selectedCardId === card.id ? 'border-primary bg-primary' : 'border-gray-200'}`}>
                          {!useNewCard && selectedCardId === card.id && (
                            <div className="w-2 h-2 bg-white rounded-full" />
                          )}
                        </div>
                      </button>
                    ))}
                    <button
                      onClick={() => setUseNewCard(true)}
                      className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${useNewCard ? 'border-primary bg-primary/5 ring-4 ring-primary/5' : 'border-gray-100 hover:border-gray-200 bg-white'}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                          </svg>
                        </div>
                        <p className="text-sm font-bold text-gray-900">Use a different card</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${useNewCard ? 'border-primary bg-primary' : 'border-gray-200'}`}>
                        {useNewCard && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {clientSecret && (useNewCard || savedCards.length === 0) ? (
                <div className="pt-4">
                  {savedCards.length > 0 && <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1 mb-3">New Card Details</p>}
                  <Elements
                    key={clientSecret}
                    options={{
                      clientSecret,
                      appearance: {
                        theme: 'stripe',
                        variables: {
                          colorPrimary: '#0A5CFF',
                          colorBackground: '#ffffff',
                          colorText: '#101828',
                          colorDanger: '#ef4444',
                          fontFamily: 'Inter, system-ui, sans-serif',
                          borderRadius: '16px',
                        },
                        rules: {
                          '.Input': {
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                          }
                        }
                      },
                      paymentMethodCreation: 'manual',
                      link: { mode: 'never' }
                    }}
                    stripe={stripePromise}
                  >
                    <CheckoutForm
                      amount={appliedPromo ? appliedPromo.finalPrice : plan.price}
                      campaignId={campaignId}
                      onSuccess={handlePaymentSuccess}
                      saveCard={saveCard}
                      setSaveCard={setSaveCard}
                      userEmail={user?.email}
                      promoCode={appliedPromo ? appliedPromo.code : null}
                      isSetupIntent={isSetupIntent}
                      isFreeTransaction={isFreeTransaction}
                      planId={planId}
                    />
                  </Elements>
                </div>
              ) : clientSecret && !useNewCard && selectedCardId ? (
                <div className="pt-6">
                  <Elements key={clientSecret} stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
                    <CheckoutForm
                      amount={appliedPromo ? appliedPromo.finalPrice : plan.price}
                      campaignId={campaignId}
                      onSuccess={handlePaymentSuccess}
                      saveCard={false}
                      setSaveCard={() => { }}
                      userEmail={user?.email}
                      paymentMethodId={selectedCardId}
                      clientSecret={clientSecret}
                      promoCode={appliedPromo ? appliedPromo.code : null}
                      isSetupIntent={isSetupIntent}
                      isFreeTransaction={isFreeTransaction}
                      planId={planId}
                    />
                  </Elements>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 1, 0.5]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-2 h-2 bg-primary rounded-full shadow-[0_0_15px_rgba(10,92,255,0.5)]"
                  />
                  <p className="text-gray-400 font-bold mt-6 uppercase tracking-widest text-[10px]">Verifying Transaction...</p>
                </div>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-center gap-6 opacity-30 grayscale contrast-125">
              <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" className="h-4" alt="Visa" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" className="h-6" alt="Mastercard" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" className="h-4" alt="Paypal" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" className="h-6" alt="Stripe" />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
