export function slideAlert(title, text, icon) {
	messenger.notifications.create({
		type: "basic",
		title,
		message: text,
		iconUrl: icon || "/chrome/content/skin/icon32x32.png"
	});
}

export function log(msg, data, mode = "log") { // log, info, warn, error
	console[mode](msg, data);
}