import client from "../client.js";

class Card {
	constructor(card, game) {
		const cardArray = card.split(" ");

		this.game = game;
		this.player = null;

		this.name = card;

		this.color = cardArray[0];
		this.value = cardArray[cardArray.length - 1];

		this.attachment = client.cards.get(card);

		console.log(this.attachment);
	}
	changeOwner(player) {
		// changes the owner of the card
		return (this.player = player);
	}
}

export default Card;
