"use client";

import { useState } from "react";
import {
    PaymentElement,
    useStripe,
    useElements,
} from "@stripe/react-stripe-js";
import { motion } from "framer-motion";
import Button from "@/components/ui/Button";
import { toast } from "react-toastify";
import { paymentService } from "@/lib/api/user/payments";

export default function CheckoutForm({ amount, campaignId, onSuccess, saveCard, setSaveCard, userEmail, paymentMethodId, clientSecret, isSetupIntent, isFreeTransaction, planId, promoCode }) {
    const stripe = useStripe();
    const elements = useElements();

    const [message, setMessage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isCardEmpty, setIsCardEmpty] = useState(true);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!stripe || (!elements && !paymentMethodId)) {
            return;
        }

        setIsLoading(true);
        setMessage(null);

        // If it's a free transaction and no card details are entered, bypass Stripe entirely
        if (isFreeTransaction && !paymentMethodId && isCardEmpty) {
            console.log("Free transaction, no card entered. Skipping Stripe validation...");
            try {
                const fulfillmentRes = await paymentService.confirmFreeOrder(planId, campaignId, promoCode);
                if (fulfillmentRes.success) {
                    onSuccess({ id: `free_${Date.now()}` });
                    return;
                } else {
                    toast.error(fulfillmentRes.message || "Failed to finalize free order");
                }
            } catch (fulfillErr) {
                toast.error(fulfillErr.response?.data?.message || "Error finalizing your free order.");
            } finally {
                setIsLoading(false);
            }
            return;
        }

        try {
            let result;

            if (isSetupIntent) {
                // Confirm SetupIntent for free transaction
                if (paymentMethodId) {
                    // With saved card
                    result = await stripe.confirmCardSetup(clientSecret, {
                        payment_method: paymentMethodId,
                    });
                } else {
                    // With new card
                    result = await stripe.confirmSetup({
                        elements,
                        confirmParams: {
                            payment_method_data: {
                                billing_details: { 
                                    email: userEmail,
                                    address: {
                                        country: 'US',
                                    }
                                }
                            }
                        },
                        redirect: "if_required",
                    });
                }
            } else if (paymentMethodId) {
                // Confirm payment with saved card
                result = await stripe.confirmCardPayment(clientSecret, {
                    payment_method: paymentMethodId,
                });
            } else {
                // Confirm payment with new card
                result = await stripe.confirmPayment({
                    elements,
                    confirmParams: {
                        return_url: `${window.location.origin}/user/payment/success`,
                        payment_method_data: {
                            billing_details: {
                                email: userEmail,
                                address: {
                                    country: 'US',
                                }
                            },
                        },
                    },
                    redirect: "if_required",
                });
            }

            const { error, paymentIntent, setupIntent } = result;

            if (error) {
                // If it's a free transaction and the error is due to missing card info, 
                // we fulfill the order directly without a card.
                if (isFreeTransaction && (error.type === "validation_error" || !paymentMethodId)) {
                    console.log("Free transaction with no card details. Fulfilling manually...");
                    try {
                        const fulfillmentRes = await paymentService.confirmFreeOrder(planId, campaignId, promoCode);
                        if (fulfillmentRes.success) {
                            onSuccess({ id: `free_${Date.now()}` });
                            return;
                        } else {
                            toast.error(fulfillmentRes.message || "Failed to finalize free order");
                        }
                    } catch (fulfillErr) {
                        toast.error(fulfillErr.response?.data?.message || "Error finalizing your free order.");
                    }
                } else if (error.type === "card_error" || error.type === "validation_error") {
                    setMessage(error.message);
                    toast.error(error.message);
                } else {
                    setMessage("An unexpected error occurred.");
                    toast.error("An unexpected error occurred.");
                }
            } else if ((paymentIntent && paymentIntent.status === "succeeded") || 
                       (setupIntent && setupIntent.status === "succeeded")) {
                
                if (isSetupIntent) {
                    // For SetupIntents (free orders), we MUST manually call a backend endpoint 
                    // to verify and fulfill the order because SetupIntents don't naturally 
                    // trigger our payment success webhook flow.
                    try {
                        const fulfillmentRes = await paymentService.confirmFreeSetup(
                            setupIntent.id, 
                            setupIntent.payment_method
                        );
                        if (fulfillmentRes.success) {
                            onSuccess(setupIntent);
                        } else {
                            toast.error(fulfillmentRes.message || "Failed to finalize free order");
                        }
                    } catch (fulfillErr) {
                        console.error("Fulfillment error:", fulfillErr);
                        toast.error(fulfillErr.response?.data?.message || "Error finalizing your free order.");
                    }
                } else {
                    onSuccess(paymentIntent);
                }
            } else {
                console.log("Payment status:", paymentIntent?.status);
            }
        } catch (err) {
            console.error("Payment error:", err);
            setMessage("An error occurred while processing your payment.");
            toast.error("An error occurred while processing your payment.");
        } finally {
            setIsLoading(false);
        }
    };

    const paymentElementOptions = {
        layout: "accordion",
        paymentMethodOrder: ['card'],
        fields: {
            billingDetails: {
                email: 'never',
                address: {
                    country: 'never',
                }
            }
        },
        readOnly: false,
    };

    return (
        <form id="payment-form" onSubmit={handleSubmit} className="space-y-6">
            {!paymentMethodId && (
                <div className="bg-white md:p-2 sm:p-4 rounded-xl border border-gray-100 shadow-sm">
                    <PaymentElement 
                        id="payment-element" 
                        options={paymentElementOptions} 
                        onChange={(e) => setIsCardEmpty(e.empty)}
                    />
                </div>
            )}

            {!paymentMethodId && (
                <div className="flex items-center gap-2 px-1">
                    <input
                        type="checkbox"
                        id="save-card"
                        checked={saveCard}
                        onChange={(e) => setSaveCard(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <label htmlFor="save-card" className="text-sm font-medium text-gray-700 cursor-pointer select-none">
                        Save this card for future use
                    </label>
                </div>
            )}

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <Button
                    disabled={isLoading || !stripe || (!elements && !paymentMethodId)}
                    type="submit"
                    variant="primary"
                    fullWidth
                    className="bg-primary hover:bg-blue-500 h-14 text-lg font-bold rounded-xl shadow-lg shadow-blue-200 transition-all hover:shadow-xl hover:-translate-y-0.5"
                >
                    {isLoading ? (
                        <div className="flex items-center justify-center gap-2">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                            />
                            Processing...
                        </div>
                    ) : (
                        isSetupIntent ? "Complete Verification · $0.00" : `Complete Payment · $${amount.toFixed(2)}`
                    )}
                </Button>
            </motion.div>

            {message && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-red-500 text-sm font-medium text-center"
                >
                    {message}
                </motion.div>
            )}
        </form>
    );
}
