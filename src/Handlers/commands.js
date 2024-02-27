import { readdirSync } from "fs";

import client from "../client.js";

export default async () => {
	const commandsArr = [];

	const commands = readdirSync("./src/Interactions/Commands");
	for (const file of commands) {
		const command = await import(`../Interactions/Commands/${file}`);
		commandsArr.push(command.default.data);
	}

	return await client.application.commands
		.set(commandsArr)
		.then(() => client.success(`Commands updated`))
		.catch((err) => client.err(err));
};
