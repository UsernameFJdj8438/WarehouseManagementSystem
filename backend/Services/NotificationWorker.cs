using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using System.Text;
using System.Text.Json;

namespace Backend.Services;

public class NotificationWorker : BackgroundService
{
    private readonly ILogger<NotificationWorker> _logger;
    private readonly IConfiguration _config;
    private readonly string _hostname;
    private readonly string _username;
    private readonly string _password;
    private const string QueueName = "notifications";

    public NotificationWorker(ILogger<NotificationWorker> logger, IConfiguration config)
    {
        _logger = logger;
        _config = config;
        _hostname = _config["RabbitMQ:Host"] ?? "rabbitmq";
        _username = _config["RabbitMQ:Username"] ?? "user";
        _password = _config["RabbitMQ:Password"] ?? "password";
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("NotificationWorker starting and waiting for messages");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var factory = new ConnectionFactory() 
                { 
                    HostName = _hostname,
                    UserName = _username,
                    Password = _password
                };

                using var connection = await factory.CreateConnectionAsync(cancellationToken: stoppingToken);
                using var channel = await connection.CreateChannelAsync(cancellationToken: stoppingToken);

                await channel.QueueDeclareAsync(queue: QueueName,
                                     durable: true,
                                     exclusive: false,
                                     autoDelete: false,
                                     arguments: null,
                                     cancellationToken: stoppingToken);

                var consumer = new AsyncEventingBasicConsumer(channel);
                consumer.ReceivedAsync += async (model, ea) =>
                {
                    var body = ea.Body.ToArray();
                    var message = Encoding.UTF8.GetString(body);
                    _logger.LogInformation("Received notification request: {0}", message);

                    // simulate work (might add actual email logic in the future)
                    await Task.Delay(2000, stoppingToken); 

                    var notification = JsonSerializer.Deserialize<NotificationMessage>(message);
                    
                    Console.WriteLine("----------------------------------------------------------");
                    Console.WriteLine($"EMAIL SENT TO: {notification?.Email}");
                    Console.WriteLine($"SUBJECT: {notification?.Subject}");
                    Console.WriteLine($"BODY: {notification?.Body}");
                    Console.WriteLine("----------------------------------------------------------");

                    await channel.BasicAckAsync(deliveryTag: ea.DeliveryTag, multiple: false, cancellationToken: stoppingToken);
                };

                await channel.BasicConsumeAsync(QueueName, autoAck: false, consumer: consumer, cancellationToken: stoppingToken);

                while (!stoppingToken.IsCancellationRequested && connection.IsOpen)
                {
                    await Task.Delay(1000, stoppingToken);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning("NotificationWorker connection failed. Retryingin 5 seconds. error: {Message}", ex.Message);
                await Task.Delay(5000, stoppingToken);
            }
        }
    }
}

public class NotificationMessage
{
    public string Email { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
}
