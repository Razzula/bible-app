const WindowTypes = Object.freeze({
	Scripture: {
		'Name': 'Scripture',
		'Type': Symbol("Scripture")
	},
	Resource: {
		'Name': 'resource',
		'Type': Symbol("resource")
	},
    Document: {
		'Name': 'document',
		'Type': Symbol("document")
	},
	Settings: {
		'Name': 'settings',
		'Type': Symbol("settings")
	},
});

export { WindowTypes };