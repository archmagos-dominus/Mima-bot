const Discord = require("discord.js")
const shuffle = require("shuffle-array")
const games = new Set();

module.exports = async (message, client) => {
  const options = {
    resultEmbed: true,
    normalEmbed: true,
    doubledown: true, // scam option
    split: true, // scam option
    timeout: 30000 // timtout inactivity
  }
  let copiedEmbed = {
    content: '',
    value: ''
  }
  let method = 'None';

  if (games.has(message.author.id)) {
    return message.channel.send('You are already playing a game!');
  }

  games.add(message.author.id);

  try {
    const DECK = [
      { suit: 'clubs', rank: 'A', value: [1, 11], emoji: "♣️" },
      { suit: 'clubs', rank: '2', value: 2, emoji: "♣️" },
      { suit: 'clubs', rank: '3', value: 3, emoji: "♣️" },
      { suit: 'clubs', rank: '4', value: 4, emoji: "♣️" },
      { suit: 'clubs', rank: '5', value: 5, emoji: "♣️" },
      { suit: 'clubs', rank: '6', value: 6, emoji: "♣️" },
      { suit: 'clubs', rank: '7', value: 7, emoji: "♣️" },
      { suit: 'clubs', rank: '8', value: 8, emoji: "♣️" },
      { suit: 'clubs', rank: '9', value: 9, emoji: "♣️" },
      { suit: 'clubs', rank: '10', value: 10, emoji: "♣️" },
      { suit: 'clubs', rank: 'J', value: 10, emoji: "♣️" },
      { suit: 'clubs', rank: 'Q', value: 10, emoji: "♣️" },
      { suit: 'clubs', rank: 'K', value: 10, emoji: "♣️" },

      { suit: 'diamonds', rank: 'A', value: [1, 11], emoji: "️️️️️️♦️" },
      { suit: 'diamonds', rank: '2', value: 2, emoji: "♦️" },
      { suit: 'diamonds', rank: '3', value: 3, emoji: "♦️" },
      { suit: 'diamonds', rank: '4', value: 4, emoji: "♦️" },
      { suit: 'diamonds', rank: '5', value: 5, emoji: "♦️" },
      { suit: 'diamonds', rank: '6', value: 6, emoji: "♦️" },
      { suit: 'diamonds', rank: '7', value: 7, emoji: "♦️" },
      { suit: 'diamonds', rank: '8', value: 8, emoji: "♦️" },
      { suit: 'diamonds', rank: '9', value: 9, emoji: "♦️" },
      { suit: 'diamonds', rank: '10', value: 10, emoji: "♦️" },
      { suit: 'diamonds', rank: 'J', value: 10, emoji: "♦️" },
      { suit: 'diamonds', rank: 'Q', value: 10, emoji: "♦️" },
      { suit: 'diamonds', rank: 'K', value: 10, emoji: "♦️" },

      { suit: 'hearts', rank: 'A', value: [1, 11], emoji: "♥️" },
      { suit: 'hearts', rank: '2', value: 2, emoji: "♥️" },
      { suit: 'hearts', rank: '3', value: 3, emoji: "♥️" },
      { suit: 'hearts', rank: '4', value: 4, emoji: "♥️" },
      { suit: 'hearts', rank: '5', value: 5, emoji: "♥️" },
      { suit: 'hearts', rank: '6', value: 6, emoji: "♥️" },
      { suit: 'hearts', rank: '7', value: 7, emoji: "♥️" },
      { suit: 'hearts', rank: '8', value: 8, emoji: "♥️" },
      { suit: 'hearts', rank: '9', value: 9, emoji: "♥️" },
      { suit: 'hearts', rank: '10', value: 10, emoji: "♥️" },
      { suit: 'hearts', rank: 'J', value: 10, emoji: "♥️" },
      { suit: 'hearts', rank: 'Q', value: 10, emoji: "♥️" },
      { suit: 'hearts', rank: 'K', value: 10, emoji: "♥️" },

      { suit: 'spades', rank: 'A', value: [1, 11], emoji: "♠️" },
      { suit: 'spades', rank: '2', value: 2, emoji: "♠️" },
      { suit: 'spades', rank: '3', value: 3, emoji: "♠️" },
      { suit: 'spades', rank: '4', value: 4, emoji: "♠️" },
      { suit: 'spades', rank: '5', value: 5, emoji: "♠️" },
      { suit: 'spades', rank: '6', value: 6, emoji: "♠️" },
      { suit: 'spades', rank: '7', value: 7, emoji: "♠️" },
      { suit: 'spades', rank: '8', value: 8, emoji: "♠️" },
      { suit: 'spades', rank: '9', value: 9, emoji: "♠️" },
      { suit: 'spades', rank: '10', value: 10, emoji: "♠️" },
      { suit: 'spades', rank: 'J', value: 10, emoji: "♠️" },
      { suit: 'spades', rank: 'Q', value: 10, emoji: "♠️" },
      { suit: 'spades', rank: 'K', value: 10, emoji: "♠️" },
    ];

    let NEWDECKS = shuffle(DECK);
    let RESULTS = '';
    let cardPrefix = '';

    for (let a = 0; a < NEWDECKS.length; a++) {
      if (NEWDECKS[a].rank == "A") {
        NEWDECKS[a].value = 11;
      }
    }

    if (NEWDECKS[0].rank == "A") {
      cardPrefix = "Soft ";
      if (NEWDECKS[2].rank == "A") {
        NEWDECKS[2].value = 1;
      }
    }

    if (NEWDECKS[2].rank == "A") {
      cardPrefix = "Soft ";
    }

    if (NEWDECKS[1].rank == "A") {
      if (NEWDECKS[3].rank == "A") {
        NEWDECKS[3].value = 1;
      }
    }


    let startAt = 5;

    let yourdeck = [NEWDECKS[0], NEWDECKS[2]];
    let yourrank = [NEWDECKS[0].rank, NEWDECKS[2].rank];
    let youremoji = [NEWDECKS[0].emoji, NEWDECKS[2].emoji];
    let yourcontent = [`${NEWDECKS[0].emoji} ${NEWDECKS[0].rank}`, `${NEWDECKS[2].emoji} ${NEWDECKS[2].rank}`];
    let value = NEWDECKS[0].value + NEWDECKS[2].value;
    let dealerdeck = [NEWDECKS[1], NEWDECKS[3]];
    let dealerrank = [NEWDECKS[1].rank, NEWDECKS[3].rank];
    let dealeremoji = [NEWDECKS[1].emoji, NEWDECKS[3].emoji];
    let dealercontent = [`${NEWDECKS[1].emoji} ${NEWDECKS[1].rank}`, `${NEWDECKS[3].emoji} ${NEWDECKS[3].rank}`];
    let dvalue = dealerdeck[0].value + dealerdeck[1].value;
    let usertag = message.author.tag;
    let avatar = message.author.displayAvatarURL();

    // waht the foook
    const normalcontent = `Type \`h\` to draw a card or type \`s\` to stand.`;
    const doubledown = `Type \`h\` to draw a card, type \`s\` to stand or type \`d\` to double down.`;
    const split = `Type \`h\` to draw a card, type \`s\` to stand or \`split\` to split`;
    let content = normalcontent;

    const normalembed = new Discord.MessageEmbed()
      .setAuthor(usertag, avatar)
      .setColor("RANDOM")
      .setDescription(normalcontent)
      .addField(`Your Hand`, `Cards: \`${yourcontent.join("\` \`")}\`\nTotal: \`${cardPrefix}${value}\``, true)
      .addField(`${client.user.username}'s Hand`, `Cards: \`${dealerdeck[0].emoji} ${dealerdeck[0].rank}\` \` ? \`\nTotal: \` ? \``, true)
      .setTitle(`Blackjack Game`)
      .setFooter("Type E or End to stop the game")

    const winembed = new Discord.MessageEmbed()
      .setAuthor(usertag, avatar)
      .setColor("#008800")
      .addField(`Your Hand`, `Cards: \`${yourcontent.join("`  `")}\`\nTotal: \`${cardPrefix}${value}\``, true)
      .addField(`${client.user.username}'s Hand`, `Cards: \`${dealercontent.join("`  `")}\`\nTotal: \`${dvalue}\``, true)
      .setTitle(`You won!`)

    const loseembed = new Discord.MessageEmbed()
      .setAuthor(usertag, avatar)
      .setColor("#880000")
      .addField(`Your Hand`, `Cards: \`${yourcontent.join("`  `")}\`\nTotal: \`${cardPrefix}${value}\``, true)
      .addField(`${client.user.username}'s Hand`, `Cards: \`${dealercontent.join("`  `")}\`\nTotal: \`${dvalue}\``, true)
      .setTitle(`You lost!`)

    const tieembed = new Discord.MessageEmbed()
      .setAuthor(usertag, avatar)
      .setColor("#888800")
      .addField(`Your Hand`, `Cards: \`${yourcontent.join("`  `")}\`\nTotal: \`${cardPrefix}${value}\``, true)
      .addField(`${client.user.username}'s Hand`, `Cards: \`${dealercontent.join("`  `")}\`\nTotal: \`${dvalue}\``, true)
      .setTitle(`It's a tie!`)

    const cancelembed = new Discord.MessageEmbed()
      .setAuthor(usertag, avatar)
      .setColor("#880000")
      .setTitle("Game Canceled")
      .setFooter("Auhh, please stay next time!")
      .setDescription("Game has succesfully been canceled!")

    const noResEmbed = new Discord.MessageEmbed()
      .setAuthor(usertag, avatar)
      .setTitle(`Game Ended`)
      .setDescription(`**${message.author.username}, your Game has Ended due to 30 seconds of Inactivity.**`)
      .setColor("RANDOM")

    const answers1 = ["h", "hit", "hi", "e", "en", "end", "s", "stand", "st", "sta", "stan"]; // normalcontent
    const answers2 = ["h", "hit", "hi", "e", "en", "end", "s", "stand", "st", "sta", "stan", "d", "dd", "double-down", "double down"]; // doubledown
    const answers3 = ["h", "hit", "hi", "e", "en", "end", "s", "stand", "st", "sta", "stan", "sp", "split", "spl", "spli"]; // split

    // wtf is this
    let filter1 = m => m.author.id == message.author.id && answers1.includes(m.content.toLowerCase()); // answers1
    let filter2 = m => m.author.id == message.author.id && answers2.includes(m.content.toLowerCase()); // answers2
    let filter3 = m => m.author.id == message.author.id && answers3.includes(m.content.toLowerCase()); // answers3
    let filter = filter1;
    let doubledtrue = false;
    let responsenow = 'h';

    if (value == 21) {
      responsenow = "s"
      if (dvalue == 21) {
        message.channel.send({ embed: tieembed })
        if (options.resultEmbed == true) {
          message.channel.send({ embeds: [tieembed] })
        }
        games.delete(message.member.id)
        method = "Tie"
        RESULTS = "Tie"
      } else {
        message.channel.send({ embed: winembed })
        if (options.resultEmbed == true) {
          message.channel.send({ embeds: [winembed] })
        }
        games.delete(message.member.id)
        method = "Blackjack"
        RESULTS = "Win"
      }
    }

    if (cardPrefix != "Soft ") {
      if (value == 9 || (value == 10 || value == 11 && dealerdeck[1].value < 10)) {
        console.log('double downable')
        content = doubledown
        filter = filter2
      } else if (yourdeck[0].rank == yourdeck[1].rank) {
        console.log('splitable')
        content = split
        filter = filter3
      }
    }

    let ori = await message.channel.send({ embed: normalembed });
    normalembed.fields[0].value = normalembed.fields[0].value.replace(copiedEmbed.value, `{yvalue}`)
    normalembed.setDescription(content);

    await message.channel.awaitMessages(filter, { max: 1, time: options.timeout }).then(
      async allresponses => {
        if (!allresponses.size) {
          responsenow = "timeout"
        } else {
          let theanswer = String(allresponses.first()).toLowerCase()
          allresponses.first().delete();
          if (["h", "hit", "hi"].includes(theanswer)) {
            let dealCard = NEWDECKS[startAt - 1]
            yourdeck.push(dealCard)
            if (dealCard.rank == "A") {
              if (yourrank.includes("A")) {
                dealCard.value = 1
              } else {
                dealCard.value = 11
                cardPrefix = "Soft "
              }
            }
            value = value + dealCard.value
            yourcontent.push(`${dealCard.emoji} ${dealCard.rank}`)
            yourrank.push(dealCard.rank)
            youremoji.push(dealCard.emoji)
            let endtrue = false
            if (value >= 21) {
              if (cardPrefix == "Soft ") {
                cardPrefix = ""
                for (let e = 0; e < yourdeck.length; e++) {
                  if (yourdeck[e].rank == "A") {
                    yourdeck[e].value = 1
                    value = value - 10
                  }
                }
              } else {
                if (dealCard.rank != "A") {
                  endtrue = true
                  responsenow = "s"
                } else {
                  cardPrefix = "Soft "
                }
              }

            }
            if (options.normalEmbed == true) {
              normalembed.fields[0].value = `Cards: \`${yourcontent.join("`  `")}\`\nTotal: \`${cardPrefix}${value}\``
            } else {
              normalembed.fields[0].value = normalembed.fields[0].value.replace(copiedEmbed.content, `\`${yourcontent.join("`  `")}\``).replace(`{yvalue}`, `${cardPrefix}${value}`)
              copiedEmbed.content = `\`${yourcontent.join("`  `")}\``
              copiedEmbed.value = `${cardPrefix}${value}`
            }
            ori.edit({ embed: normalembed })
            normalembed.fields[0].value = normalembed.fields[0].value.replace(copiedEmbed.value, `{yvalue}`)
            normalembed.setDescription(content)
            startAt++
            if (endtrue == false) {
              if (value >= 21) {
                responsenow = "s"
              } else {
                responsenow = "h"
              }
            }
          } else if (["e", "en", "end"].includes(theanswer)) {
            responsenow = "cancel"
          } else if (["s", "st", "sta", "stan", "stand"].includes(theanswer)) {
            responsenow = "s"
          } else if (["dd", "double-down", "double down", "d"].includes(theanswer)) {
            responsenow = "dd"
          } else if (["sp", "spl", "spli", "split"].includes(theanswer)) {
            responsenow = "split"
          }
        }
      }
    )

    while (responsenow == "dd") {
      doubledtrue = true
      let dealCard = NEWDECKS[startAt - 1]
      yourdeck.push(dealCard)
      if (dealCard.rank == "A") {
        if (yourrank.includes("A")) {
          dealCard.value = 1
        } else {
          dealCard.value = 11
        }
      }
      yourcontent.push(`${dealCard.emoji} ${dealCard.rank}`)
      yourrank.push(dealCard.rank)
      youremoji.push(dealCard.emoji)
      value = value + dealCard.value
      responsenow = "s"
    }

    while (responsenow == "split") {
      let deletedi = yourdeck.pop()
      value = value - deletedi.value
      yourrank.pop()
      youremoji.pop()
      yourcontent.pop()
      if (options.normalEmbed == true) {
        normalembed.fields[0].value = `Cards: \`${yourcontent.join("`  `")}\`\nTotal: \`${cardPrefix}${value}\``
      } else {
        normalembed.fields[0].value = normalembed.fields[0].value.replace(copiedEmbed.content, `\`${yourcontent.join("`  `")}\``).replace(`{yvalue}`, `${cardPrefix}${value}`)
        copiedEmbed.content = `\`${yourcontent.join("`  `")}\``
        copiedEmbed.value = `${cardPrefix}${value}`
      }
      ori.edit({ embed: normalembed })
      normalembed.fields[0].value = normalembed.fields[0].value.replace(copiedEmbed.value, `{yvalue}`)
      normalembed.setDescription(normalcontent)
      responsenow = "h"
    }

    while (responsenow == "h") {

      await message.channel.awaitMessages(filter1, { max: 1, time: options.timeout }).then(async allresponses => {
        if (!allresponses.size) {
          responsenow = "timeout"
        } else {
          let theanswer = String(allresponses.first()).toLowerCase()
          allresponses.first().delete();
          if (["h", "hi", "hit"].includes(theanswer)) {
            let dealCard = NEWDECKS[startAt - 1]
            yourdeck.push(dealCard)
            if (dealCard.rank == "A") {
              if (yourrank.includes("A")) {
                dealCard.value = 1
              } else {
                dealCard.value = 11
                cardPrefix = "Soft "
              }
            }
            value = value + dealCard.value
            yourcontent.push(`${dealCard.emoji} ${dealCard.rank}`)
            yourrank.push(dealCard.rank)
            youremoji.push(dealCard.emoji)
            let endtrue = false
            if (value >= 21) {
              if (cardPrefix == "Soft ") {
                cardPrefix = ""
                for (let usu = 0; usu < yourdeck.length; usu++) {
                  if (yourdeck[usu].rank == "A") {
                    yourdeck[usu].value = 1
                    value = value - 10
                  }
                }

              } else {
                if (dealCard.rank != "A") {
                  endtrue = true
                  responsenow = "s"
                } else {
                  cardPrefix = "Soft "
                }
              }
            }
            if (options.normalEmbed == true) {
              normalembed.fields[0].value = `Cards: \`${yourcontent.join("`  `")}\`\nTotal: \`${cardPrefix}${value}\``
            } else {
              normalembed.fields[0].value = normalembed.fields[0].value.replace(copiedEmbed.content, `\`${yourcontent.join("`  `")}\``).replace(`{yvalue}`, `${cardPrefix}${value}`)
              copiedEmbed.content = `\`${yourcontent.join("`  `")}\``
              copiedEmbed.value = `${cardPrefix}${value}`
            }
            ori.edit({ embed: normalembed })
            normalembed.fields[0].value = normalembed.fields[0].value.replace(copiedEmbed.value, `{yvalue}`)
            normalembed.setDescription(normalcontent)
            startAt++
            if (endtrue == false) {
              if (value >= 21) {
                responsenow = "s"
              } else {
                responsenow = "h"
              }
            }
          } else if (["e", "end", "en"].includes(theanswer)) {
            responsenow = "cancel"
          } else {
            responsenow = "s"
          }
        }
      })

    }

    while (responsenow == "s") {
      games.delete(message.author.id)
      while (dvalue < 17) {
        let newcard = dealerdeck.push(NEWDECKS[startAt - 1])
        dealercontent.push(`${NEWDECKS[startAt - 1].emoji} ${NEWDECKS[startAt - 1].rank}`)
        dealerrank.push(NEWDECKS[startAt - 1].rank)
        dealeremoji.push(NEWDECKS[startAt - 1].emoji)
        if (newcard.rank == "A") {
          if (dealerrank.includes("A")) {
            NEWDECKS[startAt - 1].value = 1
          } else {
            NEWDECKS[startAt - 1].value = 11
          }
        }
        dvalue = dvalue + NEWDECKS[startAt - 1].value
        if (dvalue > 21 && dealerrank.includes("A")) {
          let unu = 0
          dealerdeck.forEach(e => {
            if (e.rank == "A") {
              dealerdeck[unu].value = 1
            }
            unu++
          })
        }
        startAt++
      }
      responsenow = "INVALID"

      if (value > 21 || (dvalue <= 21 && value < dvalue)) {
        if (value > 21) {
          method = "Busted"
        } else if (dvalue == 21) {
          method = "Dealer reached 21"
        } else {
          method = "Dealer had more"
        }
        loseembed.fields[0].value = `Cards: \`${yourcontent.join("`  `")}\`\nTotal: \`${cardPrefix}${value}\``
        loseembed.fields[1].value = `Cards: \`${dealercontent.join("`  `")}\`\nTotal: \`${dvalue}\``
        if (options.resultEmbed == true) {
          ori.edit({ embed: loseembed })
        }
        RESULTS = "Lose"
        if (doubledtrue == true) {
          RESULTS = "Double Lose"
        }
      } else if (value == 21 || value > dvalue || dvalue > 21) {
        if (value == 21) {
          method = "Blackjack"
        } else if (dvalue > 21) {
          method = "Dealer Bust"
        } else {
          method = "Player had more"
        }
        winembed.fields[0].value = `Cards: \`${yourcontent.join("`  `")}\`\nTotal: \`${cardPrefix}${value}\``
        winembed.fields[1].value = `Cards: \`${dealercontent.join("`  `")}\`\nTotal: \`${dvalue}\``
        if (options.resultEmbed == true) {
          ori.edit({ embed: winembed })
        }
        RESULTS = "Win"
        if (doubledtrue == true) {
          RESULTS = "Double Win"
        }
      } else if (value == dvalue) {
        method = "Tie"
        tieembed.fields[0].value = `Cards: \`${yourcontent.join("`  `")}\`\nTotal: \`${cardPrefix}${value}\``
        tieembed.fields[1].value = `Cards: \`${dealercontent.join("`  `")}\`\nTotal: \`${dvalue}\``
        if (options.resultEmbed == true) {
          ori.edit({ embed: tieembed })
        }
        RESULTS = "Tie"
      } else {
        let errEmbed = new Discord.MessageEmbed()
          .setAuthor(usertag, avatar)
          .setTitle("An Error Occured")
          .setDescription("Uhhhh an error has okuured")
          .setFooter("Oops")
          .setColor("#FF0000")
        if (options.resultEmbed == true) {
          ori.edit({ embed: errEmbed })
        }
        RESULTS = "ERROR"
      }
    }

    while (responsenow == "cancel") {
      games.delete(message.author.id)
      if (options.resultEmbed == true) {
        ori.edit({ embed: cancelembed })
      }
      responsenow = "INVALID"
      RESULTS = "Cancel"
    }

    while (responsenow == "timeout") {
      games.delete(message.author.id)
      if (options.resultEmbed == true) {
        ori.edit({ embed: noResEmbed })
      }
      RESULTS = "Timeout"
      responsenow = "INVALID"
    }

    let FINALRESULTS = {
      result: RESULTS,
      method: method,
      yvalue: `${cardPrefix}${value}`,
      dvalue: dvalue,
      ycontent: `\`${yourcontent.join("`  `")}\``,
      dcontent: `\`${dealercontent.join("`  `")}\``,
      yrank: yourrank,
      yemoji: youremoji,
      drank: dealerrank,
      demoji: dealeremoji
    }

    return FINALRESULTS
  } catch (e) {
    console.log(`[DISCORD_BLACKJACK]: ${e.message}`)
  }
}
