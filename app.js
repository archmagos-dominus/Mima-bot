//add nom react
//add pats mima command
//add helps files


const Discord = require('discord.js');

const Enmap = require("enmap");

const client = new Discord.Client();
const { Users, CurrencyShop } = require('./dbObjects');
const { Op } = require('sequelize');
const currency = new Discord.Collection();
const PREFIX = '!';
const prefix = 'le ';
const botowner = `576824908093325335`;

client.points = new Enmap("points");

//shenanigans?

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
	currency.add(message.author.id, 5);

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
 var help = new Discord.MessageEmbed()
    .setTitle("Availible Commands")
    .setAuthor(`Leonisius`, msg.guild.iconURL())
    .setDescription("List of commands availible")
    .setColor(0x00AE86);
 help.addField(`${prefix}help`, `Shows this message`);
 help.addField(`${prefix}ping`, `Testing tool (replies with Pong)`);
 help.addField(`${prefix}pengu`, `Shitposting command`);
 help.addField(`mima/mima bot/mima-bot/mima sama/mima-sama`, `Testing tool (replies in channel to the sender)`);
 help.addField(`bad bot/rigged bot/shit bot`, `Looks for a fight`);
 help.addField(`good bot`, `*happy Mima bot noises*`);
 help.addField(`shut up`, `No u`);
 help.addField(`ded`, `Sakuya ded`);
 help.addField(`bye/goodnight`, `Farewell`);
 help.addField(`hello/hi`, `haihai`);
 help.addField(`do it mima`, `Shitposting command`);
 help.addField(`blep`, `Shitposting command`);
 help.addField(`nom`, `Shitposting command`);
 help.addField(`\*pats mima\*`, `Shitposting command`);
 help.addField(`${prefix}help xp`, `Shows xp help`);
 help.addField(`${prefix}help cash`, `Shows cash help`);

 return msg.channel.send(help);
 }
 });
 //listen for messages (in this case, listen for pings)
 client.on('message', msg => {
  var mes = msg.content.toLowerCase();
  if (mes === `${prefix}help xp`) {
  //reply with pong to the user who sent the ping
  var help = new Discord.MessageEmbed()
     .setTitle("Availible Commands")
     .setAuthor(`Leonisius`, msg.guild.iconURL())
     .setDescription("List of commands availible")
     .setColor(0x00AE86);
  help.addField(`${prefix}help xp`, `Shows this message`);
  help.addField(`${prefix}xp/${prefix}points [@username]`, `Shows your (or [username]'s xp level')`);
  help.addField(`${prefix}xpleaderboard/${prefix}xplb`, `Displays the XP Leaderboard`);
  help.addField(`${prefix}give [amount] [username]`, `Testing tool (only for bot owner)`);
  help.addField(`${prefix}cleanup`, `Maintainance tool (only for bot owner)`);

  return msg.channel.send(help);
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
 client.on('message', msg => {
  var mes = msg.content.toLowerCase();
  if (mes === 'shutup' || mes === 'shut up' || mes === 'zip it') {
  //reply with msg to the user who sent the ping
  msg.channel.send(`You shut up!<:mimadonut:856559759888351262>`);
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
   if (mes === `bye` || mes === `bye bye` || mes === `goodbye` || mes === `goodnight` || mes === `good bye` || mes === `good night`) {
   //reply with pong to the user who sent the ping
   msg.channel.send(`Bye Bye!`);
   }
   });

  //listen for messages (in this case, listen for pings)
  client.on('message', msg => {
   var mes = msg.content.toLowerCase();
   if (mes === `hello mima` || mes === `good morning mima` || mes === `hi mima` || mes === `hello` || mes === `good morning` || mes === `hi`) {
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

    //listen for messages (in this case, listen for pings)
    client.on('message', msg => {
     var mes = msg.content.toLowerCase();
     if (mes === `blep`) {
     //reply with pong to the user who sent the ping
     msg.channel.send(`https://media.discordapp.net/attachments/856873900826034176/857630758776471552/194569978_287467359753039_6614002447690624209_n.jpg`);
     }
     });
     //listen for messages (in this case, listen for pings)
     client.on('message', msg => {
      var mes = msg.content.toLowerCase();
      if (mes === `*pats mima*`) {
      //reply with pong to the user who sent the ping
      msg.channel.send(`https://cdn.discordapp.com/emojis/856597119376162876.gif`);
      }
      });
      //listen for messages (in this case, listen for pings)
      client.on('message', msg => {
       var mes = msg.content.toLowerCase();
       if (mes === `nom`) {
       //reply with pong to the user who sent the ping
       msg.channel.send(`https://cdn.discordapp.com/emojis/608605694131830805.gif`);
       }
       });

////shitmap begins where?

client.on("message", message => {
  // ignore all bots.
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
    const curLevel = Math.floor(0.25 * Math.sqrt(client.points.get(key, "points")));

    // Act upon level up by sending a message and updating the user's level in enmap.
    if (client.points.get(key, "level") < curLevel) {
      message.reply(`You've leveled up to level **${curLevel}**! Try getting a life? Lmao`);
      client.points.set(key, curLevel, "level");
    }
  }
  if (message.content.indexOf(prefix) !== 0) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();
  if (command === "points" | command === `xp`) {
    const key = `${message.guild.id}-${message.author.id}`;
    return message.channel.send(`You currently have ${client.points.get(key, "points")} points, and are level ${client.points.get(key, "level")}!`);
  }
  if(command === "xpleaderboard" || command === `xplb`) {
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
    .setDescription("The experienced 10!")
    .setColor(0x00AE86);
  for(const data of top10) {
    try {
      embed.addField(client.users.cache.get(data.user).tag, `${data.points} xp points (level ${data.level})`);
    } catch {
      embed.addField(`<@${data.user}>`, `${data.points} xp points (level ${data.level})`);
    }
  }
  return message.channel.send({embed});
}
if(command === "give") {
   // Limited to guild owner - adjust to your own preference!
   if(message.author.id !== `576824908093325335`)
     return message.reply("You're not the boss of me, you can't do that!");

   const user = message.mentions.users.first() || client.users.cache.get(args[0]);
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

   client.points.set(`${message.guild.id}-${user.id}`, userPoints, "points")

   message.channel.send(`${user.tag} has received **${pointsToAdd}** points and now stands at **${userPoints}** points.`);
 }

 if(command === "cleanup") {

   if(message.author.id !== `576824908093325335`)
     return message.reply("You're not Mima Sama the Fumo Spirit, you can't do that!");
   // Get a filtered list (for this guild only).
   const filtered = client.points.filter( p => p.guild === message.guild.id );

   // we get only users that haven't been online for a month, or are no longer in the guild.
   const rightNow = new Date();
   const toRemove = filtered.filter(data => {
     return !message.guild.members.cache.has(data.user) || rightNow - 2592000000 > data.lastSeen;
   });

   toRemove.forEach(data => {
     client.points.delete(`${message.guild.id}-${data.user}`);
   });

   message.channel.send(`I've cleaned up ${toRemove.size} old farts.`);
 }
  //
});




client.login(`ODU2NjMyNjg0NjMzNTIyMTg3.YND3Ww.sV914QH8aaoQ3W06GGkasNOeIqU`);
