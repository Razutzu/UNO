import { Client, Colors, GatewayIntentBits } from "discord.js";

import data from "./JSON/data.json" assert { type: "json" };
import chalk from "chalk";
import dotenv from "dotenv";

dotenv.config();

class ExtendedClient extends Client {
	constructor(options) {
		super(options);
		this.clr = Colors.Red;
		this.ready = false;

		this.games = new Map();
		this.embeds = {};
	}
	rawData(name) {
		return data[name];
	}
	emoji(name) {
		return this.emojis.cache.get(data.logs[name]).toString();
	}
	emojiData(name) {
		return this.emojis.cache.get(data.logs[name]);
	}
	log(color, tag, msg) {
		const time = new Date();
		return console.log(`${chalk.blue(`[ ${time.toLocaleTimeString()} ]`)} ${chalk[color](`[${tag}]`)} ${msg}`);
	}
	err(err) {
		return this.log("red", "  ERROR  ", err.stack || err);
	}
	warn(warn) {
		return this.log("red", " WARNING ", warn);
	}
	success(msg) {
		return this.log("green", " SUCCESS ", msg);
	}
	info(info) {
		return this.log("blue", "  INFO.  ", info);
	}
}

const client = new ExtendedClient({
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildEmojisAndStickers],
});

process.on("uncaughtException", (err) => client.err(err));

export default client;

import { events } from "./Handlers/events.js";
events();

client.login(process.env.TOKEN);
