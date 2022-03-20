//CODE BEGINS HERE

//includes
const Discord = require('discord.js');
const fs = require('fs');
const Canvas = require('canvas');

//dependencies and setupconst
const config = require('./config.json');
const client = new Discord.Client();
const { Users, CurrencyShop, Waifus, WaifuItems, Transactions, PlantedCurrency 	} = require('./dbObjects');
const { Op } = require('sequelize');
const currency = new Discord.Collection();
//const waifu = require('./waifus/waifu.json');
const waifushop = require('./waifus/waifushop.json');
const spevent = require('./spevent/spevent.json');

//main prefix
const PREFIX = config.PREFIX;
//special 'purple marisa' prefix
const PMORS = config.PMORS;

//global variables
var running = 0;

//shenanigans
Reflect.defineProperty(currency, 'add', {
    value: async function add(id, amount, reason = false) {
    const user = currency.get(id);
    // add currency transaction IF there is reason
    if (reason) {
      await Transactions.create({
        user_id: id,
        amount: amount,
        reason: reason
      });
    }
    if (user) {
      user.balance += Number(amount);
      return user.save();
    }
    // prevent error when someone sent a message while the bot is initializing
    const newUser = await Users.create({ user_id: id, balance: amount })
      .catch(e => undefined);
    if (!newUser) return false;
      currency.set(id, newUser);
      return newUser;
    },
});
Reflect.defineProperty(currency, 'getBalance', {
	value: function getBalance(id) {
		const user = currency.get(id);
		return user ? user.balance : 0;
	},
});
// end of shenanigans

// function to check user becaosue it took a lot of sapce and useful
function checkUser(user, message) {
	//try to get the user as it is
  var usr = message.guild.members.cache.get(user);
	//if there is an user argument and it's not formated right do some checks
  if (!usr && user) {
    // get cache and sort them based on birth time, put bots on the bottom
    // this will prioritze users over bot and shit
    const cache = message.guild.members.cache
      .sort((a, b) => a.user.createdTimestamp - b.user.createdTimestamp)
      .sort((a, b) => a.user.bot - b.user.bot);
		try {
      //try to find user by tag
      //modified to prevent gift issues also who tf uses tag???
      usr = cache.find(e => e.user.tag.toLowerCase() === user.toLowerCase())
      //try to find user by displayName
      || cache.find(e => e.displayName.toLowerCase().indexOf(user.toLowerCase()) > -1)
      //try to find user by username
      || cache.find(e => e.user.username.toLowerCase().indexOf(user.toLowerCase()) > -1);
    } catch(err) {
      return false;
    }
  }
  return usr;
}

//on start
client.once('ready', async () => {
  //fill up the user table and their money
  const storedBalances = await Users.findAll();
  storedBalances.forEach(b => currency.set(b.user_id, b));
  // NOTE: cache every users this bot knows and put em in datbase
  const inactives = client.users.cache.filter(e => storedBalances.map(m => m.user_id));
  await inactives.forEach(async user => await currency.add(user.id, 0));
  //set mima's status
  client.user.setActivity(`!help`, { type: 'WATCHING' })
    .then(presence => console.log(`Activity set to ${presence.activities[0].name}`))
    .catch(console.error);
  //cli greeting message
  console.log(`${client.user.tag} reincarnated!`);
  //greeting message in the main channel
  client.channels.cache.get(config.CHANNELID[1]).send(`Pfew, I'm back! >v<`);
});

//////////////////////////////////////////////////////////////////////////embeds
{
	//create the main help embed
	var help = new Discord.MessageEmbed()
		.setTitle("Availible Commands")
		.setAuthor(`Mima Sama the Bot Spirit`, config.thumb)
		.setColor(0x00AE86)
		.setThumbnail(config.thumb);
	help.addField('\u200B',`${config.help[0]}`);
	//create the meme help embed
	var helpm = new Discord.MessageEmbed()
		 .setTitle("Silly Commands")
		 .setAuthor(`Mima Sama the Bot Spirit`, config.thumb)
		 .setColor(0x00AE86)
		 .setThumbnail(config.thumb);
	helpm.addField(`\u200B`, `${config.help[1]}`);
	//create the xp help embed
 	var helpx = new Discord.MessageEmbed()
 	  .setTitle("XP Commands")
 	  .setAuthor(`Mima Sama the Bot Spirit`, config.thumb)
 	  .setColor(0x00AE86)
 		.setThumbnail(config.thumb);
 	helpx.addField(`\u200B`, `${config.help[2]}`);
	//create the currency help embed
	var helpc = new Discord.MessageEmbed()
		.setTitle("Currency Commands")
		.setAuthor(`Mima Sama the Bot Spirit`, config.thumb)
		.setColor(0x00AE86)
		.setThumbnail(config.thumb);
	helpc.addField(`\u200B`, `${config.help[3]}`);
	//create the help embed
	var helpg = new Discord.MessageEmbed()
		.setTitle("Gambling Commands")
		.setAuthor(`Mima Sama the Bot Spirit`, config.thumb)
		.setColor(0x00AE86)
		.setThumbnail(config.thumb);
	helpg.addField(`\u200B`, `${config.help[4]}`);
	//create the purple marisa help embed
	var helppm = new Discord.MessageEmbed()
		.setTitle("Purple Marisa Commands")
		.setAuthor(`Mima Sama the Bot Spirit`, config.thumb)
		.setColor(0x00AE86)
		.setThumbnail(config.thumb);
	helppm.addField(`\u200B`, `${config.help[5]}`);
//create the waifu help embed
	var helpwf = new Discord.MessageEmbed()
		.setTitle("Waifu Commands")
		.setAuthor(`Mima Sama the Bot Spirit`, config.thumb)
		.setDescription("List of commands availible")
		.setColor(0x00AE86)
		.setThumbnail(config.thumb);
	helpwf.addField(`\u200B`, `${config.help[6]}`);
}
///////////////////////////////////////////////////////////////////end of embeds

//tools module
client.on('message', async message => {
	//check if owner
	if (message.author.id !== config.BOTOWNER) return;
	//mkae sure message is not in DM
	if (message.channel.type === 'dm') return;
	//helper var
	mes = message.content;
	//make sure the message is sent in the right channel
	if (!(config.CHANNELID.includes(message.channel.id))) return;
	//make sure the command starts with PREFIX
	if (!mes.startsWith(PREFIX)) return;
	//slice the PREFIX
	const input = mes.slice(PREFIX.length).trim();
	//check that the command actually has something in it left
	if (!input.length) return;
	//regex madness (check that there is a commad as a word and maybe some args after it)
	if (!input.match(/(\$|\w+)\s*([\s\S]*)/)) return;
	//then store the command and the commandArgs
	var [, command, commandArgs] = input.match(/(\$|\w+)\s*([\s\S]*)/);
	//convert command to LowerCase
	command = command.toLowerCase();
	//check for the start/stop commands
	if (command === 'sleep') {
		running = 0;
		return message.channel.send(`Finally, some rest...\n (ᴗ˳ᴗ)`);
	}
	if (command === 'wake') {
		running = 1;
		return message.channel.send(`All right, all right, I'm up!\nヽ( ´O｀)ゞ`);
	}
});

// currency module
client.on('message', async message => {
	//check if bot running
	if (!running) return;
	//make sure it's not a bot
	if (message.author.bot) return;
	//mkae sure message is not in DM
	if (message.channel.type === 'dm') return;
	//check taht the user isn't banned
	if (message.member.roles.cache.find(f => f.name === config.banned)) return;
	//helper var
	mes = message.content;
	//adding currency for every message that is not a bot command
  //(if your server uses other bots make sure to include their prefix in this)
	if (!mes.startsWith(PREFIX) && !mes.startsWith('$')){
		currency.add(message.author.id, config.moni);
	}
	//PLANT COMMAND
	//check that mima actually has spare cash to give
	if (currency.getBalance(config.mima) > 10000) {
    //if he's lucky, give him 1000 coins
		if (Math.floor(Math.random()*config.plant) === 4) {
			currency.add(message.author.id, config.plant, `Random Mima gift`);
			currency.add(config.mima, -config.plant);
			client.channels.cache.get(config.BOTSPAMID).send(`You won ${config.plant}💰, ${message.author}! Yay!`);
		}
	}
	//make sure the message is sent in the right channel
	if (!(config.CHANNELID.includes(message.channel.id))) return;
	//make sure the command starts with PREFIX
	if (!mes.startsWith(PREFIX)) return;
	//slice the PREFIX
	const input = mes.slice(PREFIX.length).trim();
	//check that the command actually has something in it left
	if (!input.length) return;
	//regex madness (check that there is a commad as a word and maybe some args after it)
	if (!input.match(/(\$|\w+)\s*([\s\S]*)/)) return;
	//then store the command and the commandArgs
	var [, command, commandArgs] = input.match(/(\$|\w+)\s*([\s\S]*)/);
	//convert command to LowerCase
	command = command.toLowerCase();
	//check sender's balance or the balance of someone tagged in the message if any
	if (command === 'balance' || command === 'cash' || command === "$") {
    // if any mentions, else checkUser, else get self
    // and also get user object (always returns user)
    const target = message.mentions.users.first()
      || checkUser(commandArgs, message)?.user
      || message.author;
    return message.channel.send(
      new Discord.MessageEmbed()
      .setColor(0x00AE86)
      .setTitle(`**${target.tag}** has **${currency.getBalance(target.id)}💰**`)
    );
  }
  //check user's role inventory
  else if (command === 'roles') {
    // if any mentions, else checkUser, else get self
    // and also get user object (always returns user)
    const target = message.mentions.users.first()
      || checkUser(commandArgs, message)?.user
      || message.author;
		//get the user's data from the table
		const user = await Users.findOne({ where: { user_id: target.id } });
		const items = await user.getItems();
		//send the users inventory
		return message.channel.send(
      new Discord.MessageEmbed()
      .setColor(0x00AE86)
      .setTitle(
        // checks if items i s empty
        !(items.length) ? `${target.tag} has no roles!` :
        `${target.tag} currently owns the following: ` +
        `${items.map(t => `${t.item.name}`).join(', ')}`
      )
    );
	}
	//transferring mimicoinz to someone else
	else if (command === 'transfer' || command === 'give') {
    //getting the current amount of the user making the transfer
    const current = currency.getBalance(message.author.id);
    // looks for any string that isnt half, all or a discord id
    const targetStr = commandArgs.match(/\b(?!(half|all|(?!\d{18})\d+))\S+\b/gi)?.[0];
    // remove targetStr then we good
    // looks for half, all or number that isnt (possible) discord id
    const amountStr = commandArgs
      .replace(targetStr, '')
      .match(/\b(?!\d{18})(half|all|\d+)\b/gi)?.[0];
    if (!amountStr || !targetStr) return message.channel.send(`Sorry ${message.author}, it doesn't work this way...`);
		// getting the give message
    const msg = commandArgs.replace(amountStr, '').replace(targetStr, '').trim();
    // self-explanatoryu
    const target = checkUser(targetStr, message)?.user
      || message.author;
		//check to see if sender and receiver are different users
		if (message.author === target) return message.channel.send(`Sorry ${message.author}, it doesn't work this way...`);
    // if all, half, else parse integer
    const amount = amountStr === 'all' ? current
      : amountStr === 'half' ? Math.floor(current / 2)
      : parseInt(amountStr);
		//transfer amount checks
		//if null or not a number, NAH NO NEED TO
		//if (!amount || isNaN(amount)) return message.channel.send(`Sorry ${message.author.tag}, that's an invalid amount`);
		if (amount > current) return message.channel.send(`Sorry ${message.author.tag} you don't have that much.`);
		if (amount <= 0) return message.channel.send(`Please enter an amount greater than zero, ${message.author.tag}`);
		//do the adding and substracting
    await currency.add(message.author.id, -amount, `Given to ${target.tag} ${msg}`);
    currency.add(target.id, amount, `Received from ${message.author.tag} ${msg}`);
		//done
		return message.channel.send(
      new Discord.MessageEmbed()
      .setColor(0x00AE86)
      .setTitle(`Successfully transferred ${amount}💰 to ${target.tag}. Your current balance is ${currency.getBalance(message.author.id)}💰`)
    );
  }
  //buying roles from the shop
  else if (command === 'buy') {
    //get the item from the table
    const item = await CurrencyShop.findOne({ where: { name: { [Op.like]: commandArgs } } });
    //check the valitidy of the item
		if (item === null) return message.channel.send('That item doesn\'t exist.');
		//balance check
		if (item.cost > currency.getBalance(message.author.id)) {
			return message.channel.send(`You don't have enough coins, ${message.author}`);
		}
		//get the user data from teh table
		const user = await Users.findOne({ where: { user_id: message.author.id } });
		//check to see if he has the role already
		const role = message.guild.roles.cache.find(guild_role => guild_role.name == item.name);
		//chekc if role exists on the server
		try {
			role.name;
		} catch (e) {
			return message.channel.send('This role is not yet present on this server.');
		}
		//check if the user already owns the role
		if (message.member.roles.cache.find(f => f.name === role.name)) return message.channel.send('You already have role ' + item.name);
		//update the ballance
		currency.add(message.author.id, -item.cost, `Bought role`);
		currency.add(config.mima, item.cost);
		//give the user his item
		await user.addItem(item);
		//assign the user his role
		message.member.roles.add(role).catch(console.error);
		//confirm the purchase
		message.channel.send(`You've bought ${item.name}`);
	}
	//displaying the shop
	else if (command === 'shop') {
		const items = await CurrencyShop.findAll();
		return message.channel.send(
      items.map(i => `"${i.name}": ${i.cost} 💰\n${i.desc}\n`).join('\n'), { code: true }
    );
	}
	//displaying the top 10 leaderboard
	else if (command === 'leaderboard' || command === 'lb' ) {
		// get number from arguments, else 1
    const page = parseInt(commandArgs) || 1;
    if (page <= 0) return message.channel.send(`Please enter a page number greater than zero ${message.author.tag}`);
    // first page always starts from 0
    // NOTE: learn basic addition and multiplication
    const offset = page * 10 - 10;
    const total = Math.floor(message.guild.memberCount / 10) + 1;
    if (page > total) return message.channel.send(`Sorry but that page doesn't exist.`);
    // get only this guild's members collection
    const members = message.guild.members.cache;
    // the currency collection is a mishmash of members from other server
    // find where the keys intersect with members collection
    const filtered = members.intersect(currency);
    // sort the list
    filtered.sort((a, b) => b.balance - a.balance);
    // make it into an array, paginate, map to string, then join with newlines
    const list = filtered.toJSON()
      .slice(offset, offset + 10)
      .map(
        (u, i) => `${i + offset + 1}. ${(client.users.cache.get(u.user_id).tag)}: **${u.balance}**💰`
      ).join('\n');
    return message.channel.send(
      new Discord.MessageEmbed()
      .setTitle('Leaderboard')
      .setAuthor(client.user.username, config.thumb)
      .setDescription(list)
      .setFooter(`Page ${page} of ${total}`)
    );
  }
  //give command
  else if (command === 'award') {
    //check that owner gives the command
    if(message.author.id !== config.BOTOWNER) return message.reply("You're not Mima Sama, you can't do that!");
    //get the amount of cash mima has (needed in case of all or half)
    const current = currency.getBalance(config.mima);
    // looks for half, all or (possible) discord id
    const amountStr = commandArgs.match(/\b(?!\d{18})(half|all|\d+)\b/gi)?.[0];
    // looks for any string that isnt half, all or a discord id
    const targetStr = commandArgs.match(/\b(?!(half|all|(?!\d{18})\d+))\S+\b/gi)?.[0];
    // just in case regex doesnt work
    if (!amountStr || !targetStr) return message.channel.send(`Sorry ${message.author}, it doesn't work this way...`);
    // self-explanatoryu
    const target = checkUser(targetStr, message)?.user
      || message.author;
    // if all, half, else parse integer
    const amount = amountStr === 'all' ? current
      : amountStr === 'half' ? Math.floor(current / 2)
      : parseInt(amountStr);
		//check that mima is not the target of it
		if (target === client.user) return message.channel.send(`Huh? Is this a bribe? ( •᷄ὤ•᷅)？`);
		//award amount checks
		if (amount <= 0) return message.channel.send(`Please enter an amount greater than zero, ${message.author}`);
		//do the adding and substracting
		currency.add(config.mima, -amount);
		currency.add(target.id, amount, `Awarded by Mima`);
		//done
		return message.channel.send(`I have gifted ${amount}💰 to ${target.tag}. My current balance is ${currency.getBalance(client.user.id)}💰`);
	}
	//take command
	else if (command === 'take') {
		//check that owner gives the command
		if(message.author.id !== config.BOTOWNER) return message.reply("You're not Mima Sama, you can't do that!");
    // looks for half, all or (possible) discord id
    const amountStr = commandArgs.match(/\b(?!\d{18})(half|all|\d+)\b/gi)?.[0];
    // looks for any string that isnt half, all or a discord id
    const targetStr = commandArgs.match(/\b(?!(half|all|(?!\d{18})\d+))\S+\b/gi)?.[0];
    // just in case regex doesnt work
    if (!amountStr || !targetStr) return message.channel.send(`Sorry ${message.author}, it doesn't work this way...`);
    // self-explanatoryu
    const target = checkUser(targetStr, message)?.user
      || message.author;
    const current = currency.getBalance(target.id);
    // if all, half, else parse integer
    const amount = amountStr === 'all' ? current
      : amountStr === 'half' ? Math.floor(current / 2)
      : parseInt(amountStr);
		//check that mima is not the transferTarget
		if (target === client.user) return message.channel.send('Huh? NOT MY MONIES PLS ｡ﾟ･（>﹏<）･ﾟ｡');
		//award amount checks
		if (amount <= 0) return message.channel.send(`Please enter an amount greater than zero, ${message.author}`);
		//do the adding and substracting
		currency.add(config.mima, amount);
		currency.add(target.id, -amount, `Taken by Mima`);
		//done
		return message.channel.send(`I have taken ${amount}💰 from ${target.tag}. My current balance is ${currency.getBalance(config.mima)}💰`);
	}
	//eliminate currency from the economy
	else if (command === 'destroy') {
		//check that owner gives the command
		if(message.author.id !== config.BOTOWNER) return message.reply("You're not Mima Sama, you can't do that!");
		//amount checks
		//if null or not a number
		if (!commandArgs || isNaN(commandArgs)) return message.channel.send(`Sorry ${message.author}, that's an invalid amount`);
		//do the substracting
		currency.add(config.mima, -commandArgs);
		//done
		return message.channel.send(`I have destroyed ${commandArgs}💰. My current balance is ${currency.getBalance(config.mima)}💰`);
	}
	//account history
	else if (command === 'curtrs') {
    // looks for last, or any number that isnt discord id
    const pageStr = commandArgs.match(/\b(?!\d{18})(last|\d+)\b/gi)?.[0];
    // looks for any string that isnt last, look for possible discord id
    const targetStr = commandArgs.match(/\b(?!(last|(?!\d{18})\d+))\S+\b/gi)?.[0];
    // gets mentions, else check from string, else get self
    const target = message.mentions.users.first()
      || checkUser(targetStr, message)?.user
      || message.author;
    // getting transactions from database
    const transactions = await Transactions.findAll({
      where: { user_id: target.id },
      order: [['id', 'DESC']],
      raw: true
    });
    const page = pageStr === 'last'
      ? Math.floor(transactions.length / 10) + 1
      : parseInt(pageStr) || 1;
    if (page <= 0) return message.channel.send(`Please enter a page number greater than zero ${message.author.tag}`);
    const offset = page * 10 - 10;
    const total = Math.floor(transactions.length / 10) + 1;
    if (page > total) return message.channel.send(`Sorry but that page doesn't exist.`);
    // paginate, map to string, then join with newlines
    const transactionlist = transactions
      .slice(offset, offset + 10)
      .map(
        t => `\`${ t.amount >= 0 ? '🟢' : '🔴'} ` +
        `${new Date(t.createdAt).toLocaleString()}\`  **${t.amount}**\n` +
        `${t.reason}`
      )
      .join('\n')
      || 'No transactions recorded, yet.';
    return message.channel.send(
      new Discord.MessageEmbed()
        .setTitle(`Transactions for ${target.tag}`)
        .setColor(0x00AE86)
        .setThumbnail(target.displayAvatarURL())
        .setDescription(transactionlist)
        .setFooter(`Page ${page} of ${total}`)
    );
  }
});

// gambling module
client.on('message', async message => {
	//check if bot running
	if (!running) return;
	//if the sender is a bot ignore
	if (message.author.bot) return;
	//mkae sure message is not in DM
	if (message.channel.type === 'dm') return;
	//check taht the user isn't banned
	if (message.member.roles.cache.find(f => f.name === config.banned)) return;
	//make sure the message is sent in the right channel
	if (!(config.CHANNELID.includes(message.channel.id))) return;
	//Convert message to lower case
	const mes = message.content.toLowerCase();
	//if the message doesn't start with the PREFIX ignore
	if (!mes.startsWith(PREFIX)) return;
	//slice off the PREFIX from the message
	const input = mes.slice(PREFIX.length).trim();
	//if what is left from the message is empty ignore
 	if (!input.length) return;
	//mkae sure the trimmed message contains at least a word
	if (!input.match(/(\w+)\s*([\s\S]*)/)) return;
	//parse the first word as the command and the rest as arguments
	const [, command, commandArgs] = input.match(/(\w+)\s*([\s\S]*)/);
	//fetch the current amount of coins of the user from the database
	const currentAmount = currency.getBalance(message.author.id);
  //check if bet flipping
  if (command === `bf`) {
		//define bet vars & tempside here to get rid of 'undefined' error later on
		var bet;
		var msgbet;
		var tempside;
		//split args by ' '
  	const cmds = commandArgs.split(' ');
		//check that the arguments are actually something
		if (!cmds[0] || !cmds[1]) return;
		//check which one has numbers in it
		if (cmds[0] && cmds[0].match(/\d/)) {
			//store the bet and the side
			bet = Math.floor(cmds[0]);
			tempside = cmds[1];
		} else if (cmds[1] && cmds[1].match(/\d/)) {
			//store the bet and the side
			bet = Math.floor(cmds[1]);
			tempside = cmds[0];
		}
		//if neither arguments are numbers, check if one is half or all
		else if (cmds[0] === 'half' || cmds[1] === 'half') {
			//store the bet
			bet = Math.floor(currentAmount/2);
			//check which argument is the side
			if (cmds[0] === 'half') {
				//store the side
				tempside = cmds[1];
			} else {
				//store the side
				tempside = cmds[0];
			}
		} else if (cmds[0] === 'all' || cmds[1] === 'all') {
			//store the bet and the var for the embed
			bet = currentAmount;
			msgbet = true;
			if (cmds[0] === 'all') {
				//store the side
				tempside = cmds[1];
			} else {
				//store the side
				tempside = cmds[0];
			}
		}
		//check if bet is valid or that 0 < bet < currentAmount
		//bet is 0 or otherwise invalid
 		if (!bet || isNaN(bet)) return message.channel.send(`Sorry ${message.author}, that's an invalid bet (make it a number greater than 0)`);
		//bet is more than the person has in his account
 		if (bet > currentAmount) return message.channel.send(`${message.author} you're too poor to gamble like that.`);
		//bet is a negative number
 		if (bet <= 0) return message.channel.send(`I know times are tough, but enter an amount greater than zero, ${message.author}`);
		//check which side the guy bet on
		//define side variable
		var side;
		//if side = tails|t|0 then side = t and the same for heads
 		if (tempside === 'h' || tempside === 'heads' || tempside === 'head') {
 			side = 'h';
		} else if (tempside === 't' || tempside === 'tails' || tempside === 'tail'){
			side = 't';
		}	else {
			//if the user did not choose a valid side
			return message.channel.send(`Heads or tails ${message.author}?`);
		}
 		//coin flipping code goes here (x can be true of false at random)
 		const x = (Math.floor(Math.random() * 2) == 0);
		//define helper variables
 		var eside, coinimg;
		//pick which image to use
 		if (x) {
 			coinimg = config.coint;
			eside = 'tails';
 		} else {
			//gonna keep both versions of the coin, beacuse i like them, so:
			r = Math.floor(Math.random()*2);
 			coinimg = config.coinh[r];
			eside = 'heads';
 		}
		//define win variable for later
		var win;
		//tally the win/loss
 		if (x && side === 't') {
			//win on tails
			win = 1;
 			currency.add(message.author.id, bet, `Bet Flip`);
			currency.add(config.mima, -bet);
		} else if (!x && side === 'h'){
			//win on heads
			win = 1;
 			currency.add(message.author.id, bet, `Bet Flip`);
			currency.add(config.mima, -bet);
		} else {
			//lose
			win = 0;
  		currency.add(message.author.id, -bet, `Bet Flip`);
			currency.add(config.mima, bet);
		}
 		//make embed results
 		var flip = new Discord.MessageEmbed()
			.setTitle(`Bet flip result for ${message.author.username}`)
			.setColor(0x00AE86)
			.setThumbnail(message.author.displayAvatarURL())
			.setImage(coinimg)
			.setFooter(`Coin art by Miau#5320`);
 		if (win === 0) {
 			//you lose embed result
			flip.addField(`The coin flipped, and it was ${eside}`, '\u200B');
			if (msgbet) {
				flip.addField(`You bet: ${bet}`, `You got rekt, enjoy being homeless`);
			} else {
				flip.addField(`You bet: ${bet}`, `And you lost lmao, try again`);
			}
		} else if (win === 1) {
			//you win embed result
			flip.addField('\u200B', `The coin flipped, and it was ${eside}`);
			if (msgbet) {
				flip.addField(`You bet: ${bet}`, `And you won ${bet*2}! Wow, hax!`);
			} else {
				flip.addField(`You bet: ${bet}`, `Yay, you won ${bet*2}! Spare change...`);
			}
		}
		//display embed results
 		return message.reply(flip);
 	}
	//check if dice rolling
	if (command === `br`) {
		//define bet vars here to get rid of 'undefined' error later on
		var bet;
		var msgbet;
		//split args by ' '
		const cmds = commandArgs.split(' ');
		//check that the argument is actually something
		if (!cmds[0]) return message.channel.send(`Sorry ${message.author}, that's an invalid bet.`);;
		//check to see if the arg has numbers in it
		if (cmds[0].match(/\d/)) {
			//store the bet
			bet = Math.floor(cmds[0]);
		}
		//if argument is not a number, check if one is half or all
		else if (cmds[0] === 'half') {
			//store the bet
			bet = Math.floor(currentAmount/2);
		} else if (cmds[0] === 'all') {
			//store the bet
			bet = currentAmount;
			msgbet = true;
		}
		//check if bet is valid or that 0 < bet < currentAmount
		//bet is 0 or otherwise invalid
		if (!bet || isNaN(bet)) return message.channel.send(`Sorry ${message.author}, that's an invalid bet (make it a number greater than 0)`);
		//bet is more than the person has in his account
		if (bet > currentAmount) return message.channel.send(`${message.author} you're too poor to gamble like that.`);
		//bet is a negative number
		if (bet <= 0) return message.channel.send(`I know times are tough, but enter an amount greater than zero, ${message.author}`);
		//dice rolling code goes here (x,y are two 6 sided dice)
		const x = Math.floor(Math.random() * 6) + 1;
		const y = Math.floor(Math.random() * 6) + 1;
		//define helper variables
		var xface, yface;
		//pick which image to use
		xface = config.diceface[x-1];
		yface = config.diceface[y-1];
		//inint embed results
		var roll = new Discord.MessageEmbed()
			.setTitle(`Bet roll result for ${message.author.username}`)
			.setColor(0x00AE86);
		roll.addField(`The dice rolled, and it was:`, '\u200B');
		roll.addField(`${x}   ${y}`, '\u200B');
		roll.addField(`${xface} ${yface}`, '\u200B');
		//tally the win/loss
		if (x === 6 && y === 6){
			//win on double
			currency.add(message.author.id, bet*8, `Bet Roll`);
			currency.add(config.mima, -bet*8);
			//you win jackpot embed result
			if (msgbet) {
				roll.addField(`You bet: ${bet}`, `And you won ${bet*8}! JACKPOT!`);
			} else {
				roll.addField(`You bet: ${bet}`, `You won ${bet*8}! Should have went all in...`);
			}
		}
		else if (x+y > 7) {
			//win on sum
			currency.add(message.author.id, bet, `Bet Roll`);
			currency.add(config.mima, -bet);
			//you win on sum embed result
			if (msgbet) {
				roll.addField(`You bet: ${bet}`, `And you won ${bet*2}! Wow, hax!`);
			} else {
				roll.addField(`You bet: ${bet}`, `Yay, you won ${bet*2}! Spare change...`);
			}
		} else {
			//lose
			currency.add(message.author.id, -bet, `Bet Roll`);
			currency.add(config.mima, bet);
			//you lose embed result
			if (msgbet) {
				roll.addField(`You bet: ${bet}`, `You got rekt, enjoy being homeless`);
			} else {
				roll.addField(`You bet: ${bet}`, `And you lost lmao, try again`);
			}
		}
		//display embed results
		return message.reply(roll);
	}
	//check if turning wheel of fortune
	if (command === `wheel` || command === 'wh') {
		//define bet here to get rid of 'undefined' error later on
		var bet;
		//split args by ' '
  	const cmds = commandArgs.split(' ');
		//check that the arguments are actually something
		if (!cmds[0]) return;
		//check which one has numbers in it
		if (cmds[0] && cmds[0].match(/\d/)) {
			//store the bet
			bet = Math.floor(cmds[0]);
		}
		//if argument is not number, check if it is half or all
		else if (cmds[0] === 'half') {
			//store the bet
			bet = Math.floor(currentAmount/2);
		} else if (cmds[0] === 'all') {
			//store the bet
			bet = currentAmount;
		}
		//check if bet is valid or that 0 < bet < currentAmount
		//bet is 0 or otherwise invalid
 		if (!bet || isNaN(bet)) return message.channel.send(`Sorry ${message.author}, that's an invalid bet (make it a number greater than 0)`);
		//bet is more than the person has in his account
 		if (bet > currentAmount) return message.channel.send(`${message.author} you're too poor to gamble like that.`);
		//bet is a negative number
 		if (bet <= 0) return message.channel.send(`I know times are tough, but enter an amount greater than zero, ${message.author}`);
 		//wheel spinning code goes here
 		const x = Math.floor(Math.random() * 8);
		//define helper variables
 		var slice, whimg, win, loss;
		//build the embed
		var wheelem = new Discord.MessageEmbed()
			.setTitle(`Wheel of Fortune result for ${message.author.username}`)
			.setColor(0x00AE86)
			.setThumbnail(message.author.displayAvatarURL())
			.setFooter(`Mima art by Miau#5320`);
		//tally the wins/losses
		win = Math.floor(bet*parseFloat(config.slice[x]));
		loss = bet - win;
		currency.add(message.author.id, -bet);
		currency.add(message.author.id, win, `Wheel of Fortune`);
		currency.add(config.mima, loss);
		//edit the embed for the situation
		wheelem.addField(`The wheel spun, and it landed on ${config.slice[x]}`, '\u200B');
		wheelem.setImage(config.wheelimg[x]);
		wheelem.addField(`You bet: ${bet}`, `You won ${win}!`);
		//display embed results
 		return message.reply(wheelem);
	}
	//check if playing rps
	if (command === `rps`) {
		//define bet & tempch here to get rid of 'undefined' error later on
		var bet;
		var msgbet;
		var tmpch;
		//split args by ' '
		const cmds = commandArgs.split(' ');
		//check that the arguments are actually something
		if (!cmds[0] || !cmds[1]) return;
		//check which one has numbers in it
		if (cmds[0] && cmds[0].match(/\d/)) {
			//store the bet and the choice
			bet = Math.floor(cmds[0]);
			tmpch = cmds[1];
		} else if (cmds[1] && cmds[1].match(/\d/)) {
			//store the bet and the choice
			bet = Math.floor(cmds[1]);
			tmpch = cmds[0];
		}
		//if neither arguments are numbers, check if one is half or all
		else if (cmds[0] === 'half' || cmds[1] === 'half') {
			//store the bet
			bet = Math.floor(currentAmount/2);
			//check which argument is the choice
			if (cmds[0] === 'half') {
				//store the choice
				tmpch = cmds[1];
			} else {
				//store the choice
				tmpch = cmds[0];
			}
		} else if (cmds[0] === 'all' || cmds[1] === 'all') {
			//store the bet and the var for the embed
			bet = currentAmount;
			msgbet = true;
			if (cmds[0] === 'all') {
				//store the choice
				tmpch = cmds[1];
			} else {
				//store the choice
				tmpch = cmds[0];
			}
		}
		//check if bet is valid or that 0 < bet < currentAmount
		//bet is 0 or otherwise invalid
		if (!bet || isNaN(bet)) return message.channel.send(`Sorry ${message.author}, that's an invalid bet (make it a number greater than 0)`);
		//bet is more than the person has in his account
		if (bet > currentAmount) return message.channel.send(`${message.author} you're too poor to gamble like that.`);
		//bet is a negative number
		if (bet <= 0) return message.channel.send(`I know times are tough, but enter an amount greater than zero, ${message.author}`);
		//check which choice the guy bet on
		//define choice variable
		var ch, win;
		//store the player choice in a controlled way
		if (tmpch === 'r' || tmpch === 'rock') {
			ch = 0;
		} else if (tmpch === 'p' || tmpch === 'paper'){
			ch = 1;
		}	else if (tmpch === 's' || tmpch === 'scissors'){
			ch = 2;
		} else {
			//if the user did not choose a valid tool
			return message.channel.send(`Make a choice ${message.author}?`);
		}
		//rps code goes here
		const x = (Math.floor(Math.random() * 3));
		//check to see if win, lose or draw
		if (x === ch) {
			//draw event
  		win = 0;
		} else {
  		if (
    		(x === 0 && ch === 1) ||
    		(x === 1 && ch === 2) ||
    		(x === 2 && ch === 0)
  		) {
				//win event
    		win = 1;
				currency.add(message.author.id, bet, `Rock Paper Scissors`);
    		currency.add(config.mima, -bet);
  		} else {
				//lose event
    		win = -1;
				currency.add(message.author.id, -bet, `Rock Paper Scissors`);
    		currency.add(config.mima, bet);
  		}
		}
		//make embed results
		var rps = new Discord.MessageEmbed()
			.setTitle(`Rock/Paper/Scissors result for ${message.author.username}`)
			.setColor(0x00AE86)
			.setThumbnail(message.author.displayAvatarURL());
		if (win === 0) {
			//draw embed result
			rps.addField(`We both chose ${config.rps[x]}`, '\u200B');
			rps.addField(`It's a draw!`, `\u200B`);
		} else if (win === 1) {
			//you win embed result
			rps.addField('\u200B', `You chose ${config.rps[ch]} and I chose ${config.rps[x]}`);
			if (msgbet) {
				rps.addField(`You bet: ${bet}`, `And you won ${bet*2}! Wow, hax!`);
			} else {
				rps.addField(`You bet: ${bet}`, `Yay, you won ${bet*2}! Spare change...`);
			}
		} else if (win === -1){
			//you lose embed result
			rps.addField('\u200B', `You chose ${config.rps[ch]} and I chose ${config.rps[x]}`);
			if (msgbet) {
				rps.addField(`You bet: ${bet}`, `And you lost everything`);
			} else {
				rps.addField(`You bet: ${bet}`, `And you lost ...`);
			}
		}
		//display embed results
		return message.reply(rps);
	}
	//check if playing the slot machine
	if (command === `slots` || command === 'slot'){
		//define bet vars to get rid of 'undefined' error later on
		var bet;
		var msgbet;
		//split args by ' '
		const cmds = commandArgs.split(' ');
		//check that the argument is actually something
		if (!cmds[0]) return message.channel.send(`Sorry ${message.author}, that's an invalid bet.`);;
		//check to see if the arg has numbers in it
		if (cmds[0].match(/\d/)) {
			//store the bet
			bet = Math.floor(cmds[0]);
		}
		//if argument is not a number, check if one is half or all
		else if (cmds[0] === 'half') {
			//store the bet
			bet = Math.floor(currentAmount/2);
		} else if (cmds[0] === 'all') {
			//store the bet
			bet = currentAmount;
			msgbet = true;
		}
		//check if bet is valid or that 0 < bet < currentAmount
		//bet is 0 or otherwise invalid
		if (!bet || isNaN(bet)) return message.channel.send(`Sorry ${message.author}, that's an invalid bet (make it a number greater than 0)`);
		//bet is more than the person has in his account
		if (bet > currentAmount) return message.channel.send(`${message.author} you're too poor to gamble like that.`);
		//bet is a negative number
		if (bet <= 0) return message.channel.send(`I know times are tough, but enter an amount greater than zero, ${message.author}`);
		//bet is valid, substract it from the users account
		currency.add(message.author.id, -bet);
		//slot machine code goes here
		const w = Math.floor(Math.random() * config.slotimg.length);
		const x = Math.floor(Math.random() * config.slotimg.length);
		const y = Math.floor(Math.random() * config.slotimg.length);
		const z = Math.floor(Math.random() * config.slotimg.length);
		//Calculate wins and losses
		var win;
		if ((x === 0) && (y === 0) && (z === 0) && (w === 0)) {
			//big jackpot 4 mimas
			win = 7;
			currency.add(message.author.id, bet*100, `Slots`);
			currency.add(config.mima, -bet*100);
		} else if ((x === y) && (y === z) && (z === w)){
			//small jackpot 4 of a kind
			win = 6;
			currency.add(message.author.id, bet*25, `Slots`);
			currency.add(config.mima, -bet*25);
		} else if ((w === x && x === y) || (w === y && y === z) || (w === x && x === z) || (x === y && y === z)) {
			//triple
			win = 4;
			currency.add(message.author.id, bet*5, `Slots`);
			currency.add(config.mima, -bet*5);
		} else if ((w === x) || (w === y) || (w === z) || (x === y) || (x === z) || (y === z)) {
			//one pair
			//check if pair is mima
			if (((w === x) && (x === 0)) || ((w === y) && (y === 0)) || ((w === z) && (z === 0)) || ((x === y) && (y === 0)) || ((x === z) && (z === 0)) || ((y === z) && (z === 0))) {
				//one mima pair
				//check if tow pairs
				if (((w === x) && (y === z)) || ((w === z) && (y === x)) || ((w === y) && (x === z))) {
					//mima pair + another pair
					win = 5;
					currency.add(message.author.id, bet*8, `Slots`);
					currency.add(config.mima, -bet*8);
				} else {
					//mima pair
					win = 3;
					currency.add(message.author.id, bet*2, `Slots`);
					currency.add(config.mima, -bet*2);
				}
			} else if (((w === x) && (y === z)) || ((w === z) && (y === x)) || ((w === y) && (x === z))){
				//just normal pair
				//check if there's two of them
				win = 2;
				currency.add(message.author.id, bet*2, `Slots`);
				currency.add(config.mima, -bet*2);
			} else if ((x === 0) || (y === 0) || (z === 0) || (w === 0)) {
				//check for one mima
				win = 1;
				currency.add(message.author.id, Math.floor(bet*0.5), `Slots`);
				currency.add(config.mima, Math.floor(bet*0.5));
			} else {
				//loss
				win = 0;
				currency.add(config.mima, bet);
			}
		} else if ((x === 0) || (y === 0) || (z === 0) || (w === 0)) {
			//check for one mima
			win = 1;
			currency.add(message.author.id, Math.floor(bet*0.5), `Slots`);
			currency.add(config.mima, Math.floor(bet*0.5));
		} else {
			//loss
			win = 0;
			currency.add(config.mima, bet);
		}
		//create the image
		////create the Canvas
		const canvas = Canvas.createCanvas(400, 229);
		const context = canvas.getContext('2d');
		const background = await Canvas.loadImage(config.slotbg);
		////create the image
		////make the background
		context.drawImage(background, 0, 0, canvas.width, canvas.height);
		////add the slot wheels
		const imgw = await Canvas.loadImage(config.slotimg[w]);
		context.drawImage(imgw,  45, 75, 65, 75);
		const imgx = await Canvas.loadImage(config.slotimg[x]);
		context.drawImage(imgx, 125, 75, 65, 75);
		const imgy = await Canvas.loadImage(config.slotimg[y]);
		context.drawImage(imgy, 208, 75, 65, 75);
		const imgz = await Canvas.loadImage(config.slotimg[z]);
		context.drawImage(imgz, 288, 75, 65, 75);
		//create the attachemnt
		const attachment = new Discord.MessageAttachment(canvas.toBuffer(), 'welcome-image.png');
		//display the answer in an embed
		//make embed results
		var slots = new Discord.MessageEmbed()
			.setTitle(`Slot machine result for ${message.author.username}`)
			.setColor(0x00AE86)
			.setThumbnail(message.author.displayAvatarURL())
			.attachFiles([attachment])
			.setImage(`attachment://welcome-image.png`);
		if (win === 7) {
			//jackpot embed result
			slots.addField(`You got all the Mimas! WOW! EXTRA JACKPOT!`, '\u200B');
			slots.addField(`You win ${bet*100}`, `\u200B`);
		} else if (win === 6) {
			//you win small ajckpot embed result
			slots.addField(`You got 4 of a kind! JACKPOT!`, '\u200B');
			slots.addField(`You win ${bet*25}`, `\u200B`);
		} else if (win === 5) {
			//you win on two pairs, one of them mima
			slots.addField(`You got 2 pairs! And one of them is me!`, '\u200B');
			slots.addField(`You win ${bet*8}`, `\u200B`);
		} else if (win === 4) {
			//you win on triple
			slots.addField(`You got a triple!`, '\u200B');
			slots.addField(`You win ${bet*5}`, `\u200B`);
		} else if (win === 3) {
			//you win on mima pair
			slots.addField(`You got a pair of Mimas!`, '\u200B');
			slots.addField(`You win ${bet*2}`, `\u200B`);
		} else if (win === 2) {
			//you win on two pairs
			slots.addField(`You got two pairs`, '\u200B');
			slots.addField(`You win ${bet*2}`, `\u200B`);
		} else if (win === 1){
			//you win  on a mima
			slots.addField(`You found me! I'll give you some change lol!`, '\u200B');
			slots.addField(`You win ${Math.floor(bet*0.5)}`, `\u200B`);
		} else {
			//you lose embed result
			slots.addField(`Seems like you didn't get anything good...`, `\u200B`);
			if (msgbet) {
				slots.addField(`You bet: ${bet}`, `And you lost everything`);
			} else {
				slots.addField(`You bet: ${bet}`, `And you lost it`);
			}
		}
		//display embed results
		return message.reply(slots);
	}
});

//help module
client.on('message', message => {
	//check if bot running
	if (!running) return;
	//make sure it's not a bot
	if (message.author.bot) return;
	//mkae sure message is not in DM
	if (message.channel.type === 'dm') return;
	//check taht the user isn't banned
	if (message.member.roles.cache.find(f => f.name === config.banned)) return;
	//make sure the message is sent in the right channel
	if (!(config.CHANNELID.includes(message.channel.id))) return;
	//convert to LowerCase
	var mes = message.content.toLowerCase();
	//if the message doesn't start with the PREFIX ignore
	if (!mes.startsWith(PREFIX)) return;
	//slice off the PREFIX from the message
	const input = mes.slice(PREFIX.length).trim();
	//reply with desired help embed to the user
	if (input === `help`) return message.channel.send(help);
	if (input === `help memes`) return message.channel.send(helpm);
	if (input === `help xp`) return message.channel.send(helpx);
	if (input === `help cash`) return message.channel.send(helpc);
	if (input === `help gambling`) return message.channel.send(helpg);
	if (input === 'help marisa') return message.channel.send(helppm);
	if (input === 'help waifu') return message.channel.send(helpwf);
});

//silly reactions module (reworked)
client.on('message', message => {
	//check if bot running
	if (!running) return;
	//make sure it's not a bot
	if (message.author.bot) return;
	//mkae sure message is not in DM
	if (message.channel.type === 'dm') return;
	//check taht the user isn't banned
	if (message.member.roles.cache.find(f => f.name === config.banned)) return;
	//convert to LowerCase
	var mes = message.content.toLowerCase();
	//decide which reaction to send
	//check for the ping command
	if (mes === `!ping` || mes === `!pong`) {
		//create the ping embed
		var ping = new Discord.MessageEmbed()
			.setTitle(`Pong!:ping_pong:`)
			.setColor(0x00AE86);
		//add latency and api latency values to ping embed
		ping.addField(`Latency:`, `${Date.now() - message.createdTimestamp}ms.`, true);
		ping.addField(`API Latency:`, `${Math.round(client.ws.ping)}ms`, true);
		//reply with ping embed to the user who sent the request
		message.channel.send(ping);
	}
	////reply with ban react
	if (mes === `!ban`) {
		message.channel.send(`Time to do my job. *click*-*clack*`);
		message.channel.send(config.ATTACHMENTS[0]);
		return;
	}
	//reply with no problem react to the channel
	if (mes === `thanks mima`) return message.channel.send(config.ATTACHMENTS[1]);
	//reply with message to the user who mentioned the bot
  if (config.CALLS.includes(mes)) return message.reply(`I'm here! ${config.EMOJI[0]}`);
	//reply with threats to the channel
  if (config.SLURS.includes(mes)) {
    var a = Math.floor(Math.random() * config.SLUR_RESPONSE.length)
    message.channel.send(config.SLUR_RESPONSE[a]);
		return;
  }
	//reply with happy mima to the channel
  if (config.PRAISE.includes(mes)) {
    var a = Math.floor(Math.random() * config.PRAISE_RESPONSE.length)
    message.channel.send(config.PRAISE_RESPONSE[a]);
		return;
  }
	//reply with mimaded to the channel
	if (mes === `ded`) return message.channel.send(config.EMOJI[1]);
	//say your goodbyes
  if (config.GOODBYES.includes(mes)) {
    var a = Math.floor(Math.random() * config.GOODBYES_RESPONSE.length)
    message.channel.send(config.GOODBYES_RESPONSE[a]);
    return;
  }
	//say your greetings
  if (config.GREETINGS.includes(mes)) {
    var a = Math.floor(Math.random() * config.GREETINGS_RESPONSE.length)
    message.channel.send(config.GREETINGS_RESPONSE[a]);
    return;
  }
	//config.blep the channel
	if (mes === `blep`) return message.channel.send(config.ATTACHMENTS[2]);
	//do the config.mors/config.skukuy gifs
	if (mes === `do it mima`) {
    message.channel.send(config.ATTACHMENTS[3]);
    message.channel.send(config.ATTACHMENTS[4]);
		return;
  }
	//receive the patting
	if (mes === `*pats mima*`) return message.channel.send(config.ATTACHMENTS[5]);
});

//image processing module
client.on('message', async message => {
	//check if bot running
	if (!running) return;
	//make sure it's not a bot
	if (message.author.bot) return;
	//mkae sure message is not in DM
	if (message.channel.type === 'dm') return;
	//check taht the user isn't banned
	if (message.member.roles.cache.find(f => f.name === config.banned)) return;
	//make sure the message is sent in the right channel
	if (!(config.CHANNELID.includes(message.channel.id))) return;
	//convert to LowerCase
	var mes = message.content.toLowerCase();
	//if the message doesn't start with the PREFIX ignore
	if (!mes.startsWith(PREFIX)) return;
	//slice off the PREFIX from the message
	const input = mes.slice(PREFIX.length).trim();
	//if what is left from the message is empty ignore
	if (!input.length) return;
	//mkae sure the trimmed message contains at least a word
	if (!input.match(/(\w+)\s*([\s\S]*)/)) return;
	//parse the first word as the command and the rest as arguments
	const [, command, commandArgs] = input.match(/(\w+)\s*([\s\S]*)/);
	//convert command to LowerCase
	const cmd = command.toLowerCase();
	//jail command
	if (cmd === 'jail') {
		//helper var
		var target, tag, avt;
  	//user checks
  	if (message.mentions.users.first()) {
			//user is mentioned
    	target = message.mentions.users.first();
			//get his tag
			tag = target.tag;
			//get the avatar
			avt = target.displayAvatarURL({ format: 'png' });
  	} else if (checkUser(commandArgs, message)) {
			//get target user using checkUser function
    	target = checkUser(commandArgs, message);
			//get his tag in a different way
			tag = target.user.tag;
			//get the avatar
			avt = target.user.displayAvatarURL({ format: 'png' });
		} else {
			//if the arg is not an user, return the message author
			target = message.author;
			//get his tag
			tag = target.tag;
			//get the avatar
			avt = target.displayAvatarURL({ format: 'png' });
		}
		//initialise picture editing
		const canvas = Canvas.createCanvas(256, 256);
		const context = canvas.getContext('2d');
		const background = await Canvas.loadImage(config.jailcell);
		//create the image
		//make the background
		context.drawImage(background, 0, 0, canvas.width, canvas.height);
		//prepare the area for the avatar
		context.save();
		context.beginPath();
		context.arc(canvas.width/2, canvas.height/2, 70, 0, Math.PI * 2, true);
		context.closePath();
		context.clip();
		//make the avatar
		const avatar = await Canvas.loadImage(avt);
		context.drawImage(avatar, (canvas.width-140)/2, (canvas.height-140)/2, 140, 140);
		//add the foreground
		context.restore();
		const foreground = await Canvas.loadImage(config.jailbars);
		context.drawImage(foreground, 0, 0, canvas.width, canvas.height);
		const attachment = new Discord.MessageAttachment(canvas.toBuffer(), 'welcome-image.png');
		//return the created image
		return message.channel.send(`${tag} was put behind bars for being too horni!`, attachment);
	}
	//yeet command
	if (cmd === 'yeet') {
		//helper var
		var target, tag, avt;
  	//user checks
  	if (message.mentions.users.first()) {
			//user is mentioned
    	target = message.mentions.users.first();
			//get his tag
			tag = target.tag;
			//get the avatar
			avt = target.displayAvatarURL({ format: 'png' });
  	} else if (checkUser(commandArgs, message)) {
			//get target user using checkUser function
    	target = checkUser(commandArgs, message);
			//get his tag in a different way
			tag = target.user.tag;
			//get the avatar
			avt = target.user.displayAvatarURL({ format: 'png' });
		} else {
			//if the arg is not an user, return the message author
			target = message.author;
			//get his tag
			tag = target.tag;
			//get the avatar
			avt = target.displayAvatarURL({ format: 'png' });
		}
		//initialise picture editing
		const canvas = Canvas.createCanvas(500, 203);
		const context = canvas.getContext('2d');
		const background = await Canvas.loadImage(config.yeet);
		//create the image
		//make the background
		context.drawImage(background, 0, 0, canvas.width, canvas.height);
		//prepare the area for the avatar
		context.beginPath();
		context.arc(canvas.width/2, canvas.height/2, 70, 0, Math.PI * 2, true);
		context.closePath();
		context.clip();
		//make the avatar
		const avatar = await Canvas.loadImage(avt);
		context.drawImage(avatar, (canvas.width-140)/2, (canvas.height-140)/2, 140, 140);
		//create the attachemnt
		const attachment = new Discord.MessageAttachment(canvas.toBuffer(), 'welcome-image.png');
		//return the created image
		return message.channel.send(`${tag} was yeeted all the way to Brazil! Have fun!`, attachment);
	}
	//nom command
	if (cmd === 'nom') {
		//helper var
		var target, tag, avt;
  	//user checks
  	if (message.mentions.users.first()) {
			//user is mentioned
    	target = message.mentions.users.first();
			//get his tag
			tag = target.tag;
			//get the avatar
			avt = target.displayAvatarURL({ format: 'png' });
  	} else if (checkUser(commandArgs, message)) {
			//get target user using checkUser function
    	target = checkUser(commandArgs, message);
			//get his tag in a different way
			tag = target.user.tag;
			//get the avatar
			avt = target.user.displayAvatarURL({ format: 'png' });
		} else {
			//if the arg is not an user, return the message author
			target = message.author;
			//get his tag
			tag = target.tag;
			//get the avatar
			avt = target.displayAvatarURL({ format: 'png' });
		}
		//initialise picture editing
		const canvas = Canvas.createCanvas(339, 500);
		const context = canvas.getContext('2d');
		const background = await Canvas.loadImage(config.mimanombg);
		//create the image
		//make the background
		context.drawImage(background, 0, 0, canvas.width, canvas.height);
		//prepare the area for the avatar
		context.save();
		context.beginPath();
		context.arc(90, 403, 88, 0, Math.PI * 2, true);
		context.closePath();
		context.clip();
		//make the avatar
		const avatar = await Canvas.loadImage(avt);
		context.drawImage(avatar, 0, 315, 176, 176);
		//add the foreground
		context.restore();
		const foreground = await Canvas.loadImage(config.mimanomfg);
		context.drawImage(foreground, 0, 0, canvas.width, canvas.height);
		const attachment = new Discord.MessageAttachment(canvas.toBuffer(), 'welcome-image.png');
		//return the created image
		return message.channel.send(`${tag} is gonna get nibbled on!`, attachment);
	}
});

//xp module (reworked) (reworked)
client.on("message", async message => {
  //check if bot running
  if (!running) return;
  //make sure it's not a bot
  if (message.author.bot) return;
  //mkae sure message is not in DM
  if (message.channel.type === 'dm') return;
  //check taht the user isn't banned
  if (message.member.roles.cache.find(f => f.name === config.banned)) return;
  // find user in database
  const user = await Users.findOne({
    where: { user_id: message.author.id }
  });
  // if not found, laugh at them. maybe not
  if (!user) return /* message.channel.send('Lmao'); */
  //add xp points for his message
  await Users.update({ xp: user.xp + 1 }, { where: { user_id: message.author.id } });
  //caculate the user's current level
  const curLevel = Math.floor(config.xpmulti * Math.sqrt(user.xp));
  //on level up, update db and send a message in the bot channel
  if (user.level < curLevel) {
    client.channels.cache.get(config.BOTSPAMID).send(`You've leveled up to level **${curLevel}** ${message.author.tag}! Try getting a life? Lmao`);
    await user.update({ level: curLevel });
  }
  //make sure the message is sent in the right channel
  if (!(config.CHANNELID.includes(message.channel.id))) return;
  //convert to LowerCase
  var mes = message.content.toLowerCase();
  //if the message doesn't start with the PREFIX ignore
  if (!mes.startsWith(PREFIX)) return;
  //slice off the PREFIX from the message
  const input = mes.slice(PREFIX.length).trim();
  //if what is left from the message is empty ignore
  if (!input.length) return;
  //mkae sure the trimmed message contains at least a word
  if (!input.match(/(\w+)\s*([\s\S]*)/)) return;
  //parse the first word as the command and the rest as arguments
  const [, command, commandArgs] = input.match(/(\w+)\s*([\s\S]*)/);
  //convert command to LowerCase
  const cmd = command.toLowerCase();
  //check own or another user's xp
  if (cmd === "points" | cmd === `xp`) {
    // if any mentions, else checkUser, else get self
    // and also get user object (always returns user)
    const targetUser = message.mentions.users.first()
      || checkUser(commandArgs, message)?.user
      || message.author;
    // get target from database
    const target = await Users.findOne({ where: { user_id: targetUser.id }, raw: true });
    // error handling if target not found in database
    if (!target) return message.channel.send('Lmao');
    return message.channel.send(
      `${targetUser.tag} currently has ${target.xp} points, and is level ${target.level}!\n` +
      `Next level at ${Math.pow(5*(target.level+1),2)} points.`
    );
  }
  //displaying the xp leaderboard
  if(cmd === "xpleaderboard" || cmd === `xplb`) {
    // get number from arguments, else 1
    const page = parseInt(commandArgs) || 1;
    if (page <= 0) return message.channel.send(`Please enter a page number greater than zero ${message.author.tag}`);
    // getting all the waifus in the dataabse with order
    const users = await Users.findAll({
      order: [['xp', 'DESC']],
      raw: true
    });
    // first page always starts from 0
    const offset = page * 10 - 10;
    const total = Math.floor(users.length / 10) + 1;
    if (page > total) return message.channel.send(`Sorry but that page doesn't exist.`);
    // paginate, map to string, then join with newlines
    const userlist = users
      .slice(offset, offset + 10)
      .map((m, i) => `${i + offset + 1}. <@${m.user_id}> **${m.xp}** xp points (level **${m.level}**)`)
      .join('\n');
    return message.channel.send(
      new Discord.MessageEmbed()
      .setTitle('XP Leaderboard')
      .setAuthor(client.user.username, config.thumb)
      .setDescription(userlist)
      .setFooter(`Page ${page} of ${total}`)
    );
  }
  //award xp
  if(cmd === "givexp") {
    //check that owner gives the command
    if(message.author.id !== config.BOTOWNER) return message.reply("You're not Mima Sama, you can't do that!");
    //get and store the amount to be awarded and the beneficiary user
    //helper vars
    var transferTarget, tag, transferAmount, target, temp, amountstr;
    //user checks
    if (message.mentions.users.first()) {
      //user is mentioned
      transferTarget = message.mentions.users.first();
      //get user tag
      tag = transferTarget.tag;
      //look for the amount
      transferAmount = commandArgs.split(/ +/).find(arg => !/<@!?\d+>/.test(arg));
    } else {
      //take the args and split them by space
      var temp = commandArgs.split(' ');
      //check whether the first or last entry is the bet (int)
      if (!isNaN(temp[0])) {
        //the first part is the amount, store it
        transferAmount = parseInt(temp[0]);
        //cut away the bet from the rest of the message, which is the target
        amountstr = transferAmount.toString();
        target = commandArgs.substr(amountstr.length).trim();
      } else if (!isNaN(temp[temp.length-1])){
        //the last part is the amount, store it
        transferAmount = parseInt(temp[temp.length-1]);
        //cut away the bet from the rest of the message, which is the target
        amountstr = transferAmount.toString();
        target = commandArgs.substr(0, commandArgs.indexOf(amountstr)).trim();
      }
      //get target user using checkUser function
      if (checkUser(target, message)) {
        //check for nickname, username, tag etc
        transferTarget = checkUser(target, message);
        //get user tag
        tag = transferTarget.user.tag;
      } else {
        return message.channel.send(`I can't find that user '^^ (try @ him)`);
      }
    }
    //final target check
    if(!transferTarget) return message.reply("You must mention someone or give their ID!");
    //amount check
    //if null or not a number
    if (!transferAmount || isNaN(transferAmount)) return message.channel.send(`Sorry, that's an invalid amount`);
    // find user in database
    const user = await Users.findOne({ where: { user_id: transferTarget.id }});
    //add the points
    await user.update({ xp: user.xp + transferAmount });
    //return success message
    return message.channel.send(
      `${tag} has received **${transferAmount}** points and now stands at **${user.xp}** points.`
    );
  }
});

//purple marisa module
client.on('message', async message => {
	//check if bot running
	if (!running) return;
	//if the sender is a bot ignore
	if (message.author.bot) return;
	//mkae sure message is not in DM
	if (message.channel.type === 'dm') return;
	//make sure the message is sent in the right channel
	if (!(config.CHANNELID.includes(message.channel.id))) return;
	//check taht the user isn't banned
	if (message.member.roles.cache.find(f => f.name === config.banned)) return;
	//Convert message to lower case
	const mes = message.content.toLowerCase();
	//if the message doesn't start with the PREFIX ignore
	if (!mes.startsWith(PMORS)) return;
	//check taht the user has purple marisa role
  //deprecated because some servers might not setup the role properly
  //so only mima's DB is trusted
	//if (!message.member.roles.cache.find(f => f.name === "Purple Marisa")) return message.channel.send('You are not my Marisa');
	//check to see if the role was bought from the store or given by admin
	const user = await Users.findOne({ where: { user_id: message.author.id } });
	const items = await user.getItems();
	var tmp = items.map(t => `${t.item.name}`).join(', ').search(`Purple Marisa`);
	if (tmp === -1) return message.channel.send('You are not my Marisa');
	//slice off the PREFIX from the message
	const input = mes.slice(PMORS.length).trim();
	//if what is left from the message is empty ignore
 	if (!input.length) return;
	//mkae sure the trimmed message contains at least a word
	if (!input.match(/(\w+)\s*([\s\S]*)/)) return;
	//give meme
	// if (input === "show me memes") {
	// 	var x = Math.floor(Math.random()*1033);
	// 	let filename = config.memepath + x + ".png";
	// 	return message.channel.send({
	// 		files: [filename]
	// 	});
	// }
	// //show art
	// else if (input === "show me art") {
	// 	// var x = Math.floor(Math.random()*config.art.length);
	// 	// return message.channel.send(config.art[x]);
	// 	var x = Math.floor(Math.random()*1027);
	// 	let filename = config.artpath + x + ".png";
	// 	return message.channel.send({
	// 		files: [filename]
	// 	});
	//}
	//fortune telling (flavour """inspired""" from Stardew Valley)
	else if (input === "tell my fortune" || input === "tell me my fortune") {
		var x = Math.floor(Math.random()*config.future.length);
		return message.reply(config.future[x]);
	}
	//gives you advice
	else if (input === "what to do" || input === "what should i do") {
		var x = Math.floor(Math.random()*config.lmao.length);
		return message.channel.send(config.lmao[x]);
	}
	//tarot reading (tells you your destiny)
	else if (input === "read my destiny") {
		//choose 3 tarot cards
		var x = Math.floor(Math.random()*config.tarotcard.length);
		var y = Math.floor(Math.random()*config.tarotcard.length);
		var z = Math.floor(Math.random()*config.tarotcard.length);
		//make a single image out of all of them
		////create the Canvas
		const canvas = Canvas.createCanvas(210, 120);
		const context = canvas.getContext('2d');
		const background = await Canvas.loadImage(config.tarotb);
		////create the image
		////make the background
		context.drawImage(background, 0, 0, canvas.width, canvas.height);
		////add the cards
		const imgx = await Canvas.loadImage(config.tarotcard[x]);
		context.drawImage(imgx, 0, 0, 70, canvas.height);
		const imgy = await Canvas.loadImage(config.tarotcard[y]);
		context.drawImage(imgy, 70, 0, 70, canvas.height);
		const imgz = await Canvas.loadImage(config.tarotcard[z]);
		context.drawImage(imgz, 140, 0, 70, canvas.height);
		//create the attachemnt
		const attachment = new Discord.MessageAttachment(canvas.toBuffer(), 'welcome-image.png');
		//make the embed and add the card images and readings
		//past reading ("The card that best describes your past is: tarotdesc[x]")
		var cards = new Discord.MessageEmbed()
			.setTitle("Your tarot card reading")
			.setAuthor(`Mima Sama the Bot Spirit`, config.thumb)
			.setColor(0x00AE86)
			.setThumbnail(message.author.displayAvatarURL())
			.attachFiles([attachment])
  		.setImage(`attachment://welcome-image.png`);
			//.setImage(attachment);
		cards.addField(`The cards reflecting your destiny are:`, `\u200B`);
		cards.addField(`Past:`, `${config.tarotdesc[x]}`);
		cards.addField(`Present:`, `${config.tarotdesc[y]}`);
		cards.addField(`Future:`, `${config.tarotdesc[z]}`);
		//post the embed to the channel
		return message.channel.send(cards);
	}
	//8ball like behaviour for everything else
  //to be replaced by conversational AI later on
	else {
		var x = Math.floor(Math.random()*config.crystalball.length);
		return message.reply(config.crystalball[x]);
	}
});

//Waifu module
client.on('message', async message => {
	//check if bot running
	if (!running) return;
	//make sure it's not a bot
	if (message.author.bot) return;
	//mkae sure message is not in DM
	if (message.channel.type === 'dm') return;
	//check taht the user isn't banned
	if (message.member.roles.cache.find(f => f.name === config.banned)) return;
	//make the key for current user
	const key = message.author.id;
  //deprecated because now we use a real database not a fucking json file lmfao
	//if user is new, put him in the database
	// if(!waifu[key]){
	// 	waifu[key] = {
	// 		id: message.author.id,
	// 		value: 2500,
	// 		ownedby: "No one",
	// 		owns: [],
	// 		inv: []
	// 	};
	// 	for (var x in waifushop.items) {
	// 		waifu[key].inv.push(0);
	// 	}
	// }
	// fs.writeFile("./waifus/waifu.json", JSON.stringify(waifu), (err) =>{
	// 	if (err) console.log(err)
	// });
	//helper var
	mes = message.content;
  //make sure the message is sent in the right channel
	if (!(config.CHANNELID.includes(message.channel.id))) return;
	//make sure the command starts with PREFIX
	if (!mes.startsWith(PREFIX)) return;
	//slice the PREFIX
	const input = mes.slice(PREFIX.length).trim();
	//check that the command actually has something in it left
	if (!input.length) return;
	//regex madness (check that there is a commad as a word and maybe some args after it)
	if (!input.match(/(\$|\w+)\s*([\s\S]*)/)) return;
	//then store the command and the commandArgs
	var [, command, commandArgs] = input.match(/(\$|\w+)\s*([\s\S]*)/);
	//convert command to LowerCase
	command = command.toLowerCase();
	//check user waifu informations
	if (command === 'waifuinfo') {
    // if any mentions, else checkUser, else get self
    // and also get user object (always returns user)
    const target = message.mentions.users.first()
      || checkUser(commandArgs, message)?.user
      || message.author;
    // get user from database with their owner and waifus
    const targetUser = await Users.findOne({
      where: { user_id: target.id },
      include: ['waifus'],
    });
    // TODO: simplify
    // this is for value and owner
    const targetWaifu = await Waifus.findOne({
      where: { waifu_id: target.id },
      include: ['owner']
    });
    // if owner exists, try to get tag from cache, else just use the id
    // else no one owned
    const owner = targetWaifu?.owner
      ? client.users.cache.get(targetWaifu.owner.user_id+'1')?.tag
        || `<@${targetWaifu.owner.user_id}>`
      : 'No one';
    // get every waifu user object
    // try to get tag from cache, else just use the id
    const waifus = targetUser.waifus.map(
      w => client.users.cache.get(w.waifu_id+'1')?.tag || `<@${w.waifu_id}>`
    ).join('\n')
      || 'None';
    // uses function from dbObject.js then concat
    const gifts = (await targetUser.getGifts()).map(
      g => `${g.name}: ${g.count}`
    ).join('\n')
      || 'None';
    const embed = new Discord.MessageEmbed()
      .setTitle(`Waifu info for ${target.tag}`)
      .setColor(0x00AE86)
      .addField('Owned by: ', owner)
      .addField('Current value: ', targetWaifu?.value || config.WAIFU_DEFAULT)
      .addField('Gifts:', gifts, true)
      .addField('Waifus:', waifus, true);
    return message.channel.send(embed);
  }
	// claim waifu with db #claimdb
	if (command === 'claim') {
		// get from database so we can use getWaifus function from dbObjects.js
		const owner = await Users.findOne({ where: { user_id: message.author.id } });
		// if any mentions, else checkUser and also get user object (always returns user)
		const target = message.mentions.users.first() || checkUser(commandArgs, message)?.user;
		// target checks, not found, self, bot
		if (!target) {
			return message.channel.send(`Sorry ${message.author}, I just couldn't find the user`);
		} else if (target === message.author) {
			return message.channel.send(`Trying to marry yourself ${message.author}? How sad...`);
		} else if (target === client.user) {
			return message.channel.send(`I'm sorry, my heart belongs to someone else... ^v^`);
		}
		// get array of owned waifus
		const waifus = await owner.getWaifus();
		// check if author had claimed my man
		if (waifus.map(w => w.waifu.user_id).includes(target.id)) {
			return message.channel.send(`Umm... You're already married...`);
		}
		// find waifu in database to get their value
		const waifu = await Waifus.findOne({ where: { waifu_id: target.id }, raw: true });
		// if waifu isn't in database set their value to default
		const value = waifu?.value || config.WAIFU_DEFAULT;
		// check if my guy has enuff cashmoney
		if (currency.getBalance(message.author.id) < value) {
			return message.channel.send(`Sorry ${message.author}, you just don't have the mimicoinz for this one.`);
		}
		currency.add(message.author.id, -value, `Bought Waifu`);
		currency.add(config.mima, value);
		// update or insert new data with 10% bonus value
		Waifus.upsert({
			owner_id: owner.user_id,
			waifu_id: target.id,
			value: Math.floor(value * 1.1)
		});
		return message.channel.send(`Yay! ${message.author} claimed ${target.tag} for ${value}! Love is in the air! <3`);
	}
	// #divorcedb
	if (command === 'divorce') {
    // get from database so we can use getWaifus function from dbObjects.js
    // and see user's owner
    const user = await Users.findOne({
      where: { user_id: message.author.id },
      include: ['waifuinfo']
    });
    // if any mentions, else checkUser and also get user object (always returns user)
    const target = message.mentions.users.first() || checkUser(commandArgs, message)?.user;
    // target checks, not found, self, bot
    if (!target) {
      return message.channel.send(`Sorry ${message.author}, I just couldn't find the user`);
    } else if (target === message.author) {
      return message.channel.send(`Consider your life choices`);
    } else if (target === client.user) {
      return message.channel.send(`I'm not married to you lmao`);
    }
    // get array of owned waifus
    const waifus = await user.getWaifus();
    // check if user is claimed waifu or claimed by owner
    if (
      !(waifus.map(w => w.waifu.user_id).includes(target.id)
        || user.waifuinfo?.owner_id === target.id)
    ) {
      return message.channel.send(`You don't have any relationship with them`);
    }
    // find waifu in database to get their value
    const waifu = await Waifus.findOne({ where: { waifu_id: target.id } });
    // bof party get this amount
    const value = Math.floor(waifu.value / 4);
    currency.add(message.author.id, value, `Divorce consolation`);
    currency.add(target.id, value, `Divorce consolation`);
    currency.add(config.mima, Math.floor(-value * 2));
    // this is if an owner wants to divorce waifu
    if (waifus.map(w => w.waifu.user_id).includes(target.id)) {
      // make waifu owner empty, instead of deleteing the whole data
      Waifus.update({ owner_id: null }, { where: { waifu_id: target.id } });
      // use this if a waifu wants to divorce the wwoenr
    } else if (user.waifuinfo?.owner_id === target.id) {
      Waifus.update({ owner_id: null }, { where: { waifu_id: message.author.id } })
    }
    return message.channel.send(
      `It didn't work out between ${message.author} and ${target.tag}. They are now divorced.\n` +
      `They each got ${value} back.`
    );
  }
	//display giftshop
	if (command === 'gifts' || command === 'waifushop') {
		const giftls = waifushop.items.map(i => `**${i.id}.** ${i.name}: **${i.cost}** 💰`);
		return message.channel.send(
			new Discord.MessageEmbed()
			.setTitle(`Gift shop for your waifu(s)`)
			.setColor(0x00AE86)
			.setThumbnail(message.author.displayAvatarURL())
			.addField('ID. Name: Price', giftls)
			.setFooter(`To buy a gift use !gift [username] [giftID]`)
		);
	}
	//gift to a waifu
	if (command === 'gift') {
    const balance = currency.getBalance(message.author.id);
    const targetStr = commandArgs.match(/\b(?!((?!\d{18})\d+))\S+\b/gi)?.[0];
    const target = message.mentions.users.first()
      || checkUser(targetStr, message)?.user
      || message.author;
		if (!target) {
			return message.channel.send(`Sorry ${message.author}, I just couldn't find the user`);
		} else if (target === message.author) {
			return message.channel.send(`Gifting yourself, ${message.author}?`);
		} else if (target === client.user) {
			return message.channel.send(`I'm sorry, my heart belongs to someone else... ^v^`);
		}
		// gift id is always 1-2 digit number, and limit multiply to 99, defaults 1
		// NOTE: for gift multiplying to work, modify checkUser function
		const [giftId, multiply=1] = commandArgs.match(/\b\d{1,2}(?!\S)/g)
      ? commandArgs.match(/\b\d{1,2}(?!\S)/g).map(x => parseInt(x))
      : [];
		const gift = waifushop.items[giftId];
		if (!gift) {
			return message.channel.send(`Sorry ${message.author.tag}, that's an invalid gift ID`);
		}
		// math variabless
		const totalGift = gift.cost * multiply;
		//get waifu
		const waifu = await Waifus.findOne({ where: { waifu_id: target.id } });
		// add default waifu value if waifu hasnt claimed
		const totalValue = Math.floor((waifu?.value || config.WAIFU_DEFAULT) + totalGift / 2);
		if (balance < totalGift) {
			return message.channel.send(`Sorry ${message.author.tag}, you need more mimicoinz.`);
		}
		// looping to insert gifts
		for (let i = 0; i < multiply; i++) {
			await WaifuItems.create({
				waifu_id: target.id, name: gift.name, cost: gift.cost
			});
		}
		// update or insert waifu data with updated value
		await Waifus.upsert({
			waifu_id: target.id,
			value: totalValue
		});
		currency.add(message.author.id, -totalGift, `Gifted waifu`);
		currency.add(config.mima, totalGift);
		return message.channel.send(
			new Discord.MessageEmbed()
			.setColor(0x00AE86)
			.setTitle(`Successfully gifted ${multiply} ${gift.name}(s) ` + `to ${target.tag} (Currently valued at **${totalValue}**💰)`)
		);
	}
	// #waifulbdb
	if (command === 'waifulb' || command === 'waifus') {
    // get number from arguments, else 1
    const page = parseInt(commandArgs) || 1;
    if (page <= 0) return message.channel.send(`Please enter a page number greater than zero ${message.author.tag}`);
    // getting all the waifus in the dataabse with order
    const waifus = await Waifus.findAll({
      order: [['value', 'DESC']],
      raw: true
    });
    // first page always starts from 0
    // NOTE: learn basic addition and multiplication
    const offset = page * 10 - 10;
    const total = Math.floor(waifus.length / 10) + 1;
    if (page > total) return message.channel.send(`Sorry but that page doesn't exist.`);
    // paginate, map to string, then join with newlines
    const waifulist = waifus
      .slice(offset, offset + 10)
      .map((m, i) => {
        const id = m.waifu_id || m.userID;
        const tag = client.users.cache.get(id)?.tag
          || `<@${id}>`;
      	return `${i + offset + 1}. ${tag} worth **${m.value}**💰`
      })
      .join('\n');
    return message.channel.send(
      new Discord.MessageEmbed()
      .setTitle('Waifu Leaderboard')
      .setAuthor(client.user.username, config.thumb)
      .setDescription(waifulist)
      .setFooter(`Page ${page} of ${total}`)
    );
  }
});

//special event module
client.on('message', async message => {
  //check if bot running
  if (!running) return;
  //make sure it's not a bot
  if (message.author.bot) return;
  //mkae sure message is not in DM
  if (message.channel.type === 'dm') return;
  //check taht the user isn't banned
  if (message.member.roles.cache.find(f => f.name === config.banned)) return;
  //current date&time setup
  let ts = Date.now();
  let date_time = new Date(ts);
  var cmonth = date_time.getMonth();
  if (config.month !== cmonth) {
    //check if past event is running
    if (spevent[config.month].st === 1) {
      //past event points as sorted json
      const sorted = await Users.findAll({ order: [['points', 'DESC']] });
      // make rank string
      const ranklist = sorted
        .map((m, i) => {
          // default variable for non top 3
          var prize = 1000;
          var message = false;
          // check if user is in top 3
          if (i <= 2) {
            // prize for each rank
            prize = i === 0 ? 50000
              : i === 1 ? 25000
              : 10000;
            message = `${i + 1}. <@${m.user_id}> scored **${m.points}** points and won ${prize}`
          }
          currency.add(m.user_id, prize,'Special Event Prize');
          return message;
        })
      // filter empty messages
        .filter(Boolean)
        .join('\n');
      //make the table
      //create the event end embed
      const eventend = new Discord.MessageEmbed()
        .setTitle(`${spevent[config.month].name} Event Over - Final Leaderboard`)
        .setAuthor('\u200B', config.thumb)
        .setDescription(`The past event is over, here is the final leaderboard\n${ranklist}`)
        .setColor(0x00AE86);
      //diplay winners
      config.ANNOUNCEMENTID.forEach(channel => {
        client.channels.cache.get(channel).send(eventend);
      });
      //client.channels.cache.get(config.announcement).send(eventend);
      //reset past event
      spevent[config.month].st = 0;
      fs.writeFileSync("./spevent/spevent.json", JSON.stringify(spevent, null, 2));
      // reset event database for EVERYONE
      sorted.forEach(u => u.update({ items: 0, points: 0 }) );
      //increment month
      config.month = cmonth;
      fs.writeFileSync("./config.json", JSON.stringify(config, null, 2));
      //post new event details
      var eventstart = new Discord.MessageEmbed()
        .setTitle(`${spevent[config.month].name} Event Start`)
        .setAuthor('\u200B', config.thumb)
        .setDescription(`The new event is here!\n${spevent[config.month].description}`)
        .setColor(0x00AE86);
      //post it to the channel
      //client.channels.cache.get(config.announcement).send(eventstart);
      config.ANNOUNCEMENTID.forEach(channel => {
        client.channels.cache.get(channel).send(eventstart);
      });
      //event state set to true
      spevent[cmonth].st = 1;
      fs.writeFileSync("./spevent/spevent.json", JSON.stringify(spevent, null, 2));
    } else {
      //increment month
      config.month = cmonth;
      fs.writeFileSync("./config.json", JSON.stringify(config, null, 2));
      //post new event details
      var eventstart = new Discord.MessageEmbed()
        .setTitle(`${spevent[config.month].name} Event Start`)
        .setAuthor('\u200B', config.thumb)
        .setDescription(`The new event is here!\n${spevent[config.month].description}`)
        .setColor(0x00AE86);
      //post it to the channel
      //client.channels.cache.get(config.announcement).send(eventstart);
      config.ANNOUNCEMENTID.forEach(channel => {
        client.channels.cache.get(channel).send(eventstart);
      });
      //set event state as true
      spevent[cmonth].st = 1;
      fs.writeFileSync("./spevent/spevent.json", JSON.stringify(spevent, null, 2));
    }
  }
  //helper var
  mes = message.content;
  //make sure the message is sent in the right channel
	if (!(config.CHANNELID.includes(message.channel.id))) return;
  //make sure the command starts with PREFIX
  if (!mes.startsWith(PREFIX)) return;
  //slice the PREFIX
  const input = mes.slice(PREFIX.length).trim();
  //check that the command actually has something in it left
  if (!input.length) return;
  //regex madness (check that there is a commad as a word and maybe some args after it)
  if (!input.match(/(\$|\w+)\s*([\s\S]*)/)) return;
  //then store the command and the commandArgs
  var [, command, commandArgs] = input.match(/(\$|\w+)\s*([\s\S]*)/);
  //convert command to LowerCase
  command = command.toLowerCase();
  //collect special item
  if (command === 'collect') {
    // get message author from database
    const user = await Users.findOne({ where: { user_id: message.author.id }});
    // error handling just in case user doesnt sexist database
    if (!user) return message.channel.send('Lmao');
    // check cooldown
    if ((ts - user.event_cd) < 60000) {
      //tell him he has to  wait
      return message.channel.send(`Slow down ${message.author}, next collect in ${Math.floor(((user.event_cd + 60000) - ts)/1000)} seconds`);
    }
    // give player one item and update cooldown timestamp
    await user.update({
      items: user.items + 1,
      event_cd: ts
    });
    //tell him he got it
    return message.channel.send(`You got one ${spevent[config.month].itemname}${spevent[config.month].itemicon}!`);
  }
  //do special action
  if (command === spevent[config.month].actionname) {
    // get message author from database
    const user = await Users.findOne({ where: { user_id: message.author.id }});
    // error handling if message author not found in database
    if (!user) return message.channel.send('Lmao');
    // if any mentions, else checkUser, else get self
    // and also get user object (always returns user)
    const target = message.mentions.users.first()
      || checkUser(commandArgs, message)?.user
      || message.author;
    //check if user is [action] himself
    if (target.id === message.author.id) {
      return message.channel.send(`Don't do that to yourself...`);
    }
    // check user's items
    // return if not enough
    if (user.items <= 0) {
      return message.channel.send(`You're out of ${spevent[config.month].itemsname}, try collecting more.`);
    }
    //calc chance
    var success = Math.floor(Math.random()*2);
    if (success === 1) {
      //display Successfull action response
      message.channel.send(spevent[config.month].onactiontrue);
    } else {
      //display failed action response
      message.channel.send(spevent[config.month].onactionfalse);
    }
    // use one item for the action
    // and update points (success is either 0 or 1)
    await user.update({
      items: user.items - 1,
      points: user.points + success
    });
  }
  //display event leaderboard
  if (command === 'eventlb') {
    // get number from arguments, else 1
    const page = parseInt(commandArgs) || 1;
    if (page <= 0) return message.channel.send(`Please enter a page number greater than zero ${message.author.tag}`);
    // getting all the waifus in the dataabse with order
    const users = await Users.findAll({
      order: [['points', 'DESC']],
      raw: true
    });
    // first page always starts from 0
    const offset = page * 10 - 10;
    const total = Math.floor(users.length / 10) + 1;
    if (page > total) return message.channel.send(`Sorry but that page doesn't exist.`);
    // paginate, map to string, then join with newlines
    const userlist = users
      .slice(offset, offset + 10)
      .map((m, i) => `${i + offset + 1}. <@${m.user_id}> - **${m.points} points**`)
      .join('\n');
    return message.channel.send(
      new Discord.MessageEmbed()
      .setTitle('Event Leaderboard')
      .setAuthor(client.user.username, config.thumb)
      .setDescription(userlist)
      .setFooter(`Page ${page} of ${total}`)
    );
  }
  //display user's event info
  if (command === 'eventstats') {
    // if any mentions, else checkUser, else get self
    // and also get user object (always returns user)
    const targetUser = message.mentions.users.first()
      || checkUser(commandArgs, message)?.user
      || message.author;
    // get target from database
    const target = await Users.findOne({ where: { user_id: targetUser.id }, raw: true });
    // error handling if target not found in database
    if (!target) return message.channel.send('Lmao');
    // send embed results
    return message.channel.send(
      new Discord.MessageEmbed()
      .setTitle(`Event info for ${targetUser.tag}`)
      .setColor(0x00AE86)
      .addField(`Current points: `, target.points)
      .addField(
        `${spevent[config.month].itemicon}${spevent[config.month].itemsname}: `,
        target.items
      )
    );
  }
  //display info about the curernt event
  if (command === 'eventinfo') {
    //build embed
    var eventinfo = new Discord.MessageEmbed()
      .setTitle(`Event info for ${spevent[config.month].name}`)
      .setColor(0x00AE86);
    //fetch points
    eventinfo.addField(`Event description: `, spevent[config.month].description);
    //display response
    message.channel.send(eventinfo);
  }
});

//login to discordapp
client.login(config.TOKEN);
