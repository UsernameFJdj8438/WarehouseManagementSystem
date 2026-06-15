using RabbitMQ.Client;
using System.Text;
using System.Text.Json;

namespace Backend.Services;

public interface IRabbitMQService
{
    Task PublishMessageAsync<T>(string queueName, T message);
}

public class RabbitMQService : IRabbitMQService
{
    private readonly IConfiguration _config;
    private readonly ILogger<RabbitMQService> _logger;
    private readonly string _hostname;
    private readonly string _username;
    private readonly string _password;

    public RabbitMQService(IConfiguration config, ILogger<RabbitMQService> logger)
    {
        _config = config;
        _logger = logger;
        _hostname = _config["RabbitMQ:Host"] ?? "rabbitmq";
        _username = _config["RabbitMQ:Username"] ?? "user";
        _password = _config["RabbitMQ:Password"] ?? "password";
    }

    public async Task PublishMessageAsync<T>(string queueName, T message)
    {
        try
        {
            var factory = new ConnectionFactory() 
            { 
                HostName = _hostname,
                UserName = _username,
                Password = _password
            };

            using var connection = await factory.CreateConnectionAsync();
            using var channel = await connection.CreateChannelAsync();

            await channel.QueueDeclareAsync(queue: queueName,
                                 durable: true,
                                 exclusive: false,
                                 autoDelete: false,
                                 arguments: null);

            var json = JsonSerializer.Serialize(message);
            var body = Encoding.UTF8.GetBytes(json);

            await channel.BasicPublishAsync(exchange: string.Empty,
                                 routingKey: queueName,
                                 body: body);
            
            _logger.LogInformation("Sent message to queue {QueueName}: {Message}", queueName, json);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error publishing message to RabbitMQ");
        }
    }
}
