const WindowTypes = Object.freeze({
	Scripture: {
		'name': 'Scripture',
		'type': Symbol('Scripture'),
        'iconPath': '/bible-app/icons/Scripture.svg'
	},
	Resource: {
		'name': 'Resources',
		'type': Symbol('resource'),
        'iconPath': '/bible-app/icons/resource.svg'
	},
    Document: {
		'name': 'Documents',
		'type': Symbol('document'),
        'iconPath': '/bible-app/icons/document.svg'
	},
	Settings: {
		'name': 'Settings',
		'type': Symbol('settings'),
        'iconPath': '/bible-app/icons/settings.svg'
	},
    Landing: {
        'name': 'landing',
        'type': Symbol('landing'),
        'iconPath': '/bible-app/icons/home.svg'
    }
});

export { WindowTypes };
