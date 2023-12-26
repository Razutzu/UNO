import { readdirSync } from "fs";

import client from "../client.js";

export async function events() {
	const events = readdirSync("./src/Events");

	for (const file of events) {
		const event = await import(`../Events/${file}`);

		if (event.default.once) client.once(event.default.name, (...args) => event.default.run(...args));
		else client.on(event.default.name, (...args) => event.default.run(...args));
	}

	return true;
}
