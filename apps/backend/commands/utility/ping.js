module.exports = {
  name: 'ping',
  aliases: ['p'],
  category: 'utility',
  description: 'Check bot response time',
  
  async execute(ctx, baileys) {
    const start = Date.now();
    await baileys.sendMessage(ctx.botId, ctx.from, '🏓 Pong!');
    const latency = Date.now() - start;
    await baileys.sendMessage(ctx.botId, ctx.from, `⏱️ ${latency}ms`);
  },
};