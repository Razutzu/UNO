import { AttachmentBuilder } from "discord.js";

import cards from "../JSON/cards.json" assert { type: "json" };
import client from "../client.js";

export default async () => {
	for (const card of cards) {
		const cardFileName = card.replace(/ /g, "");

		const attachment = new AttachmentBuilder().setName(`${cardFileName}.png`).setFile(`cards/${cardFileName}.png`);

		client.cards.set(card, attachment);
	}
};
