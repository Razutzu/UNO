import client from "../client.js";

import commands from "../Handlers/commands.js";
import send from "../Handlers/send.js";

export default {
	name: "ready",
	once: false,
	run: async () => {
		await commands.call();
		send.call();

		client.success(`${client.user.username} is ready`);
	},
};
