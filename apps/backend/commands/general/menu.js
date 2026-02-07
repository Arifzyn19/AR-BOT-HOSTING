const plugin = {
  name: 'menu',
  aliases: ['help'],
  category: 'general',
  description: 'Show command list',
  
  async execute(ctx, baileys) {
    const menu = `
╭─「 *BOT MENU* 」
│
├ *General* 
│ • ${ctx.prefix}menu
│ • ${ctx.prefix}ping
│
├ *Admin*
│ • ${ctx.prefix}add
│
├ *Group*
│ • ${ctx.prefix}tagall
│ • ${ctx.prefix}antilink
│
╰────────────
`.trim();
    
    await baileys.sendMessage(ctx.botId, ctx.from, menu);
  },
};

export default plugin;
