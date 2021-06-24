

const Discord = require('discord.js');
const { Op } = require('sequelize');
const Enmap = require("enmap");

const client = new Discord.Client();
const { Users, CurrencyShop } = require('./dbObjects');
const currency = new Discord.Collection();
const PREFIX = '!';
const prefix = '~';

client.points = new Enmap("points");

/*
 * Make sure you are on at least version 5 of Sequelize! Version 4 as used in this guide will pose a security threat.
 * You can read more about this issue On the [Sequelize issue tracker](https://github.com/sequelize/sequelize/issues/7310).
 */

Reflect.defineProperty(currency, 'add', {
	/* eslint-disable-next-line func-name-matching */
	value: async function add(id, amount) {
		const user = currency.get(id);
		if (user) {
			user.balance += Number(amount);
			return user.save();
		}
		const newUser = await Users.create({ user_id: id, balance: amount });
		currency.set(id, newUser);
		return newUser;
	},
});

Reflect.defineProperty(currency, 'getBalance', {
	/* eslint-disable-next-line func-name-matching */
	value: function getBalance(id) {
		const user = currency.get(id);
		return user ? user.balance : 0;
	},
});

client.once('ready', async () => {
	const storedBalances = await Users.findAll();
	storedBalances.forEach(b => currency.set(b.user_id, b));
	console.log(`Logged in as ${client.user.tag}!`);
});


client.on('message', async message => {
	if (message.author.bot) return;
	currency.add(message.author.id, 1);

	if (!message.content.startsWith(PREFIX)) return;
	const input = message.content.slice(PREFIX.length).trim();
	if (!input.length) return;
	const [, command, commandArgs] = input.match(/(\w+)\s*([\s\S]*)/);

	if (command === 'balance') {
		const target = message.mentions.users.first() || message.author;
		return message.channel.send(`${target.tag} has ${currency.getBalance(target.id)}💰`);
	} else if (command === 'inventory') {
		const target = message.mentions.users.first() || message.author;
		const user = await Users.findOne({ where: { user_id: target.id } });
		const items = await user.getItems();

		if (!items.length) return message.channel.send(`${target.tag} has nothing!`);
		return message.channel.send(`${target.tag} currently has ${items.map(t => `${t.amount} ${t.item.name}`).join(', ')}`);
	} else if (command === 'transfer') {
		const currentAmount = currency.getBalance(message.author.id);
		const transferAmount = commandArgs.split(/ +/).find(arg => !/<@!?\d+>/.test(arg));
		const transferTarget = message.mentions.users.first();

		if (!transferAmount || isNaN(transferAmount)) return message.channel.send(`Sorry ${message.author}, that's an invalid amount`);
		if (transferAmount > currentAmount) return message.channel.send(`Sorry ${message.author} you don't have that much.`);
		if (transferAmount <= 0) return message.channel.send(`Please enter an amount greater than zero, ${message.author}`);

		currency.add(message.author.id, -transferAmount);
		currency.add(transferTarget.id, transferAmount);

		return message.channel.send(`Successfully transferred ${transferAmount}💰 to ${transferTarget.tag}. Your current balance is ${currency.getBalance(message.author.id)}💰`);
	} else if (command === 'buy') {
		const item = await CurrencyShop.findOne({ where: { name: { [Op.like]: commandArgs } } });
		if (!item) return message.channel.send('That item doesn\'t exist.');
		if (item.cost > currency.getBalance(message.author.id)) {
			return message.channel.send(`You don't have enough currency, ${message.author}`);
		}

		const user = await Users.findOne({ where: { user_id: message.author.id } });
		currency.add(message.author.id, -item.cost);
		await user.addItem(item);

		message.channel.send(`You've bought a ${item.name}`);
	} else if (command === 'shop') {
		const items = await CurrencyShop.findAll();
		return message.channel.send(items.map(i => `${i.name}: ${i.cost}💰`).join('\n'), { code: true });
	} else if (command === 'leaderboard') {
		return message.channel.send(
			currency.sort((a, b) => b.balance - a.balance)
				.filter(user => client.users.cache.has(user.user_id))
				.first(10)
				.map((user, position) => `(${position + 1}) ${(client.users.cache.get(user.user_id).tag)}: ${user.balance}💰`)
				.join('\n'),
			{ code: true },
		);
	}
});



/////mental retardation begins here

//listen for messages (in this case, listen for pings)
client.on('message', msg => {
 var mes = msg.content.toLowerCase();
 if (mes === `${prefix}help`) {
 //reply with pong to the user who sent the ping
 msg.channel.send('List of commands: \n ~ping \n mima/mima bot/mima-bot/mima sama \n ~pengu \n bad bot/rigged bot \n ded');
 }
 });

//listen for messages (in this case, listen for pings)
client.on('message', msg => {
 var mes = msg.content.toLowerCase();
 if (mes === `${prefix}ping`) {
 //reply with pong to the user who sent the ping
 msg.channel.send('Pong!:ping_pong:');
 }
 });

//listen for messages (in this case, listen for mima)
client.on('message', msg => {
 var mes = msg.content.toLowerCase();
 if (mes === 'mima' || mes === "mima bot" || mes === 'mima-bot' || mes === 'mima sama' || mes === 'mima-sama') {
 //reply with msg to the user who mentioned the bot
 msg.reply('I\'m here! <:mimadonut:856559759888351262>');
 }
 });

//listen for messages (in this case, listen for pengu)
client.on('message', msg => {
 var mes = msg.content.toLowerCase();
 if (mes === `${prefix}pengu`) {
 //reply with msg to the user who sent the ping
 msg.channel.send(`Largest poop hole in ${msg.guild.region}<:mimadonut:856559759888351262>`);
 }
 });
//listen for messages (in this case, listen for bad bot)
client.on('message', msg => {
 var mes = msg.content.toLowerCase();
 if (mes === 'bad bot' || mes === 'rigged bot' || mes === 'shit bot') {
 //reply with msg to the user who sent the ping
 msg.channel.send(`Say that to my face ${msg.author} and see what happends<:mimadonut:856559759888351262>`);
 }
 });
//listen for messages (in this case, listen for good bot)
client.on('message', msg => {
 var mes = msg.content.toLowerCase();
 if (mes === 'good bot') {
 //reply with msg to the user who sent the ping
 msg.channel.send(`https://media.discordapp.net/attachments/523518398102241280/807011772439199775/mima1.gif`);
 }
 });

//listen for messages (in this case, listen for pings)
client.on('message', msg => {
 var mes = msg.content.toLowerCase();
 if (mes === `ded`) {
 //reply with pong to the user who sent the ping
 msg.channel.send(`<:sakuyaded:856558299326971944>`);
 }
 });

 //listen for messages (in this case, listen for pings)
 client.on('message', msg => {
  var mes = msg.content.toLowerCase();
  if (mes === `bye mima` || mes === `bye bye mima` || mes === `goodbye mima` || mes === `goodnight mima`) {
  //reply with pong to the user who sent the ping
  msg.reply(`Bye Bye!`);
  }
  });

  //listen for messages (in this case, listen for pings)
  client.on('message', msg => {
   var mes = msg.content.toLowerCase();
   if (mes === `hello mima` || mes === `good morning mima` || mes === `hi mima`) {
   //reply with pong to the user who sent the ping
   msg.reply(`Hewoo!`);
   }
   });

   //listen for messages (in this case, listen for pings)
   client.on('message', msg => {
    var mes = msg.content.toLowerCase();
    if (mes === `do it mima`) {
    //reply with pong to the user who sent the ping
    msg.channel.send(`https://media.discordapp.net/attachments/856534871672619031/857564995503783956/marisa-mors.gif`);
    msg.channel.send(`https://cdn.discordapp.com/attachments/856534871672619031/857565082388922368/tohomorsskukuy.gif`);
    }
    });

////shitmap begins where?

client.on("message", message => {
  // As usual, ignore all bots.
  if (message.author.bot) return;

  // If this is not in a DM, execute the points code.
  if (message.guild) {
    // We'll use the key often enough that simplifying it is worth the trouble.
    const key = `${message.guild.id}-${message.author.id}`;

    // Triggers on new users we haven't seen before.
    client.points.ensure(`${message.guild.id}-${message.author.id}`, {
      user: message.author.id,
      guild: message.guild.id,
      points: 0,
      level: 1
    });

    client.points.inc(key, "points");

    // Calculate the user's current level
    const curLevel = Math.floor(0.1 * Math.sqrt(client.points.get(key, "points")));

    // Act upon level up by sending a message and updating the user's level in enmap.
    if (client.points.get(key, "level") < curLevel) {
      message.reply(`You've leveled up to level **${curLevel}**! Ain't that dandy?`);
      client.points.set(key, curLevel, "level");
    }
  }
  if (message.content.indexOf(config.prefix) !== 0) return;

  const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();
  if (command === "points") {
    const key = `${message.guild.id}-${message.author.id}`;
    return message.channel.send(`You currently have ${client.points.get(key, "points")} points, and are level ${client.points.get(key, "level")}!`);
  }
  if(command === "leaderboard") {
  // Get a filtered list (for this guild only), and convert to an array while we're at it.
  const filtered = client.points.filter( p => p.guild === message.guild.id ).array();

  // Sort it to get the top results... well... at the top. Y'know.
  const sorted = filtered.sort((a, b) => b.points - a.points);

  // Slice it, dice it, get the top 10 of it!
  const top10 = sorted.splice(0, 10);

  // Now shake it and show it! (as a nice embed, too!)
  const embed = new Discord.MessageEmbed()
    .setTitle("Leaderboard")
    .setAuthor(client.user.username, message.guild.iconURL())
    .setDescription("Our top 10 points leaders!")
    .setColor(0x00AE86);
  for(const data of top10) {
    try {
      embed.addField(client.users.cache.get(data.user).tag, `${data.points} points (level ${data.level})`);
    } catch {
      embed.addField(`<@${data.user}>`, `${data.points} points (level ${data.level})`);
    }
  }
  return message.channel.send({embed});
}
if(command === "give") {
   // Limited to guild owner - adjust to your own preference!
   if(message.author.id !== message.guild.ownerID)
     return message.reply("You're not the boss of me, you can't do that!");

   const user = message.mentions.users.first() || client.users.get(args[0]);
   if(!user) return message.reply("You must mention someone or give their ID!");

   const pointsToAdd = parseInt(args[1], 10);
   if(!pointsToAdd)
     return message.reply("You didn't tell me how many points to give...")

   // Ensure there is a points entry for this user.
   client.points.ensure(`${message.guild.id}-${user.id}`, {
     user: message.author.id,
     guild: message.guild.id,
     points: 0,
     level: 1
   });

   // Get their current points.
   let userPoints = client.points.get(`${message.guild.id}-${user.id}`, "points");
   userPoints += pointsToAdd;


   // And we save it!
   client.points.set(`${message.guild.id}-${user.id}`, userPoints, "points")

   message.channel.send(`${user.tag} has received **${pointsToAdd}** points and now stands at **${userPoints}** points.`);
 }

 if(command === "cleanup") {
   // Let's clean up the database of all "old" users,
   // and those who haven't been around for... say a month.

   // Get a filtered list (for this guild only).
   const filtered = client.points.filter( p => p.guild === message.guild.id );

   // We then filter it again (ok we could just do this one, but for clarity's sake...)
   // So we get only users that haven't been online for a month, or are no longer in the guild.
   const rightNow = new Date();
   const toRemove = filtered.filter(data => {
     return !message.guild.members.cache.has(data.user) || rightNow - 2592000000 > data.lastSeen;
   });

   toRemove.forEach(data => {
     client.points.delete(`${message.guild.id}-${data.user}`);
   });

   message.channel.send(`I've cleaned up ${toRemove.size} old farts.`);
 }
  // Rest of message handler
});




client.login(`ODU2NjMyNjg0NjMzNTIyMTg3.YND3Ww.sV914QH8aaoQ3W06GGkasNOeIqU`);
