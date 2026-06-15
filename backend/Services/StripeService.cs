using Stripe;
using Backend.Models;
using Microsoft.Extensions.Configuration;

namespace Backend.Services;

public class StripeService : IStripeService
{
    private readonly string _secretKey;

    public StripeService(IConfiguration config)
    {
        _secretKey = config["Stripe:SecretKey"] ?? throw new ArgumentNullException("Stripe Secret Key is missing");
        StripeConfiguration.ApiKey = _secretKey;
    }

    // this is 
    public async Task<PaymentIntent> CreatePaymentIntentAsync(RentalPayment payment)
    {
        var options = new PaymentIntentCreateOptions
        {
            // stripe amounts are in cents so they have to be multiplied
            Amount = (long)(payment.Amount * 100),
            Currency = "usd",
            PaymentMethodTypes = new List<string> { "card" },
            Metadata = new Dictionary<string, string>
            {
                { "PaymentID", payment.PaymentID.ToString() },
                { "ContractID", payment.ContractID.ToString() }
            }
        };

        var service = new PaymentIntentService();
        return await service.CreateAsync(options);
    }
}
