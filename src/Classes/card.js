import client from "../client.js";

class Card {
	constructor(card, game) {
		this.array = card.split(" ");

		this.game = game;
		this.player = null;

		this.name = card;
		this.id = this.array.join("_");

		this.color = this.array[0];
		this.value = this.array[this.array.length - 1];

		this.attachment = `attachment://${this.array.join("")}.png`;
	}
	// changeOwner(player) {
	// 	// changes the owner of the card
	// 	return (this.player = player);
	// }
	update(color) {
		this.color = color;
		this.name = `${color} ${this.name}`;

		this.array = this.name.split(" ");
		this.id = this.array.join("_");

		this.attachment = `attachment://${this.array.join("")}.png`;
	}
	isPlayable() {
		return this.color == "Wild" || this.color == this.game.lastCard.color || this.value == this.game.lastCard.value;
	}
}

export default Card;
