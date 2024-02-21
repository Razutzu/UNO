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
	};
	client.components = {
		nothing: new StringSelectMenuOptionBuilder().setLabel("Nothing").setValue("nothing"),
	};
};
