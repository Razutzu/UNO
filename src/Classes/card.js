import client from "../client.js";

class Card {
	constructor(card, game) {
		const cardArray = card.split(" ");

		this.game = game;
		this.player = null;

		this.name = card;
		this.id = cardArray.join("_");

		this.color = cardArray[0];
		this.value = cardArray[cardArray.length - 1];

		this.attachment = `attachment://${cardArray.join("")}.png`;
	}
	changeOwner(player) {
		// changes the owner of the card
		return (this.player = player);
	}
	isPlayable() {
		return this.color == "Wild" || (this.color == this.game.lastCard.color) == this.color || this.value == this.game.lastCard.value;
	}
}

export default Card;
