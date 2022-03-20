# mima-bot

## Summary
  Mima-bot is a gambling/entertainment discord bot written in `NodeJS`. It features a currency system, an XP system, a plethora of games to play, special monthly events and much more. The core idea behind  this project is based on simplicity and efficiency, allowing Mima-bot variants to be hosted locally on lower end computers (including `RaspberryPi` models) while also not generating a huge amount of network traffic. This project is completely free to use and modify to suit your needs. The code is well commented so that even a beginner might understand the way this app works.

## Add to your server
  If you can't/don't want to host your own instance of Mima-bot, you can invite the original version in your server using this [link](https://discord.com/api/oauth2/authorize?client_id=856632684633522187&permissions=137707777088&scope=bot).
    **NOTE**: You will still need to send me a message in order to set up the bot to work with your server channels. Send a pm to **Leonisius#8639** and I'll do that for you.

## Requirements
  The following are required to run Mima-bot:
  - computer with internet connection
  - `node v16.13.1`
  - `canvas@2.8.0`
  - `discord.js@12.5.3`
  - `sequelize@6.6.5`
  - `sqlite3@5.0.2`

## Setting up
  All the variables you will need to edit in order to make Mima-bot work in your server(s) are located in the `config.json` file. Make sure to edit the `TOKEN` value with your own token, as well as `CHANNELID` and `ANNOUNCEMENTID` with the id's of the channel(s) Mima-bot will be present on. The `BOTOWNER` value should be your discord ID so that you can use the bot owner commands.

## Basic usage
  Once the initial setup has been completed, run `node app.js`.

  If everything is correct, Mima will reply in the `CHANNELID` telling you that she is ready.

  You can then use `!wake` in the channel to wake her up. From there, use `!help` to get a list of commands.

## Feature Roadmap
  1. Add blackjack
  2. Integrate Mima-bot with the ShanghAI backend for basic conversational use.
