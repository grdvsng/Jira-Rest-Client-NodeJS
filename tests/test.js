const JiraClient = require('../bin/JiraClient')['JiraClient'];

let params = 
	{
		"log":      "./test.log",
		"host":     "localhost",
		"port":     "8080",
		"protocol": "http",

		"headers":
		{
			"Content-Type": "application/json"
		},
	},
	auth = {
		type: 'basic',
		data: 
		{
			username: 'admin',
			password: 'admin'
		}
	};

let App   = new JiraClient(params, auth),
	_user = 
	{
		"password":     "abracadabra",
		"emailAddress": "Travolta@atlassian.com",
		"displayName":  "John Travolta",
		"name":         "scientology666",
		"applicationKeys": []
	};


//setTimeout(async () => await App.createUser(_user), 3500);
//setTimeout(async () => await App.addUserInGroup(_user.name, 'jira-software-users'), 7000);
//setTimeout(async () => await App.removeUserFromGroup(_user.name, 'jira-software-users'), 10500);
setTimeout(async () => await App.addUserInProject(["admin"], 'TEST', 'Developers'), 3000);
//setTimeout(async () => await App.removeUserFromGroup(_user.name, 'jira-software-users'), 14000);
//setTimeout(async () => await App.deleteUser(_user.name), 17500);
