using Stripe;
using Backend.Models;

namespace Backend.Services;

public interface IStripeService
{
    Task<PaymentIntent> CreatePaymentIntentAsync(RentalPayment payment);
}
