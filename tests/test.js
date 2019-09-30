const JiraClient = require('../bin/JiraClient')['JiraClient'];

let params = 
	{
		"log":      "./test.log",
		"host":     "127.0.0.1",
		"port":     "8080",
		"protocol": "http",

		"headers":
		{
			"Content-Type": "application/json",
		},
	},
	auth = {
		type: 'session',
		data: 
		{
			username: 'admin',
			password: 'admin'
		}
	};

let App = new JiraClient(params, auth);

//App.getIsue('Test-1');