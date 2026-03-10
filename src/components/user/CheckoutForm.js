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

export default function CheckoutForm({ amount, campaignId, onSuccess, saveCard, setSaveCard, userEmail }) {
    const stripe = useStripe();
    const elements = useElements();

    const [message, setMessage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setIsLoading(true);

        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/user/payment/success`,
                payment_method_data: {
                    billing_details: {
                        email: userEmail,
                        address: {
                            country: 'US', // Default country to satisfy Stripe's requirement for hidden fields
                        }
                    },
                },
            },
            redirect: "if_required",
        });

        if (error) {
            if (error.type === "card_error" || error.type === "validation_error") {
                setMessage(error.message);
                toast.error(error.message);
            } else {
                setMessage("An unexpected error occurred.");
                toast.error("An unexpected error occurred.");
            }
        } else if (paymentIntent && paymentIntent.status === "succeeded") {
            toast.success("Payment successful!");
            onSuccess(paymentIntent);
        } else {
            // Redirection handled by confirmPayment for other status or if redirect: "always"
            console.log("Payment status:", paymentIntent?.status);
        }

        setIsLoading(false);
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
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <PaymentElement id="payment-element" options={paymentElementOptions} />
            </div>

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

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <Button
                    disabled={isLoading || !stripe || !elements}
                    type="submit"
                    variant="primary"
                    fullWidth
                    className="bg-[#0A5CFF] hover:bg-[#3B82F6] h-14 text-lg font-bold rounded-xl shadow-lg shadow-blue-200 transition-all hover:shadow-xl hover:-translate-y-0.5"
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
                        `Complete Payment · $${amount.toFixed(2)}`
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
