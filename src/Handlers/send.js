import { StringSelectMenuOptionBuilder, EmbedBuilder } from "discord.js";

import client from "../client.js";

export default () => {
	client.embeds = {
		gameExists: new EmbedBuilder().setColor(client.clr).setDescription("There is already an existent game on this channel."),
		noGame: new EmbedBuilder().setColor(client.clr).setDescription("There is no game on this channel."),
		alreadyJoined: new EmbedBuilder().setColor(client.clr).setDescription("You already joined this game."),
		notJoined: new EmbedBuilder().setColor(client.clr).setDescription("You did not join this game."),
		notJoinedSecond: new EmbedBuilder().setColor(client.clr).setDescription("That user did not join this game."),
		notHost: new EmbedBuilder().setColor(client.clr).setDescription("You are not the host of the game."),
		gameLocked: new EmbedBuilder().setColor(client.clr).setDescription("This game is locked."),
		banned: new EmbedBuilder().setColor(client.clr).setDescription("You are banned from this game."),
		oneMorePlayer: new EmbedBuilder().setColor(client.clr).setDescription("At least one more player must join to use this button."),
		cantUse: new EmbedBuilder().setColor(client.clr).setDescription("You can't do that during the game."),
		notStarted: new EmbedBuilder().setColor(client.clr).setDescription("The game hasn't started yet."),
		notPlaying: new EmbedBuilder().setColor(client.clr).setDescription("You are not playing this round."),
		noCard: new EmbedBuilder().setColor(client.clr).setDescription("You do not have that card."),
		notWild: new EmbedBuilder().setColor(client.clr).setDescription("You did not play a Wild card."),
		gameFull: new EmbedBuilder().setColor(client.clr).setDescription("The game is already full."),
		notYourTurn: new EmbedBuilder().setColor(client.clr).setDescription("It is not you turn."),
		cantPlay: new EmbedBuilder().setColor(client.clr).setDescription("You can't use that button/menu now."),
		cardNotPlayable: new EmbedBuilder().setColor(client.clr).setDescription("You can't play that card."),
		left: new EmbedBuilder().setColor(client.clr).setDescription("You left the game successfully!"),
		info: new EmbedBuilder()
			.setColor(client.clr)
			.setDescription(
				"This bot was made just for fun. It is also [open source](https://github.com/Razutzu/UNO), but if you care about your mental health, don't go see it.\n\nThe bot follows the classic rules of UNO, but with a few changes:\n-Stacking. In UNO, you can stack more cards of the same type. Also, when a Draw Two card is used, you could stack it and not get punished. To be honest, the code was starting to get messy and I was too lazy to do the stacking part.\n-Wild Draw Four. There is rule, that isn't really known or used by players, which says that you can use a Wild Draw Four card only when you don't have a card with the color of the last card played (Search online for more details). So I decided to not put this rule in my game, as it is very confusing for new players.\n\nOther details: The bot is made in Discord.js v14.14.1, Node.js v20.9.0, by **[@razutzu](https://discord.com/users/987034028043563090)**\n\nThank you for using the bot!"
			),
	};
	client.components = {
		nothing: new StringSelectMenuOptionBuilder().setLabel("Nothing").setValue("nothing"),
	};
};
