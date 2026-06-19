namespace WarehouseManagementSystem.Services
{
    public interface INotification
    {
        void Send(string message);
    }

    public class EmailNotification : INotification
    {
        public void Send(string message) => System.Console.WriteLine($"Email sent: {message}");
    }

    public class SmsNotification : INotification
    {
        public void Send(string message) => System.Console.WriteLine($"SMS sent: {message}");
    }

    // THE FACTORY
    public static class NotificationFactory
    {
        public static INotification CreateNotification(string type)
        {
            return type.ToLower() switch
            {
                "email" => new EmailNotification(),
                "sms" => new SmsNotification(),
                _ => throw new System.ArgumentException("Unknown notification type")
            };
        }
    }
}