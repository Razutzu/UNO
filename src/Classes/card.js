import client from "../client.js";

class Card {
	constructor(card, game) {
		this.game = game;
		this.player = null;

		this.color = card.startsWith("Wild") ? "Wild" : card.split(" ")[0];
		this.value = card.startsWith("Wild") ? "Wild" : card.split(" ").slice(1).join(" ");

		this.attachment = client.cards.get(card);

		console.log(this.attachment);
	}
	changeOwner(player) {
		// changes the owner of the card
		return (this.player = player);
	}
}

export default Card;
