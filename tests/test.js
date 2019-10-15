/**
 * Tests
 * @author <a href="mailto:grdvsng@gmail.com">Trishkin Sergey</a>
 */

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

let App = new require('../bin/JiraClient')['JiraClient'](params, auth);

let _user = 
{
	"password":     "abracadabra",
	"emailAddress": "Travolta@atlassian.com",
	"displayName":  "John Travolta",
	"name":         "scientology666",
	"applicationKeys": []
};


class __Test__
{
	constructor(method, params, exec)
	{
		this.method = method;
		this.params = params;
		this.exec   = exec;
	}
}

let tests = 
[
	new __Test__('search', ["project = Test And resolution = Unresolved", 0, 50]),
	new __Test__('search', ["project = Test And resolution = Unresolved", 0, 50]),
	new __Test__('search', ["project = Test And resolution = Unresolved", 0, 50]),
	new __Test__('search', ["project = Test And resolution = Unresolved", 0, 50]),
	new __Test__('search', ["project = Test And resolution = Unresolved", 0, 50]),
	new __Test__('search', ["project = Test And resolution = Unresolved", 0, 50]),
	new __Test__('search', ["project = Test And resolution = Unresolved", 0, 50]),
	new __Test__('search', ["project = Test And resolution = Unresolved", 0, 50]),
	new __Test__('search', ["project = Test And resolution = Unresolved", 0, 50]),
	new __Test__('search', ["project = Test And resolution = Unresolved", 0, 50]),
	new __Test__('search', ["project = Test And resolution = Unresolved", 0, 50]),
	new __Test__('search', ["project = Test And resolution = Unresolved", 0, 50])
];


//setTimeout(async () => await App.createUser(_user), 3500);
//setTimeout(async () => await App.createUser(_user), 3500);
//setTimeout(async () => await App.addUserInGroup(_user.name, 'jira-software-users'), 7000);
//setTimeout(async () => await App.removeUserFromGroup(_user.name, 'jira-software-users'), 10500);
//setTimeout(async () => await App.addUserInProject(["admin"], 'TEST', 'Developers'), 3000);
//setTimeout(async () => await App.removeUserFromGroup(_user.name, 'jira-software-users'), 14000);
//setTimeout(async () => await App.deleteUser(_user.name), 17500);

async function __unit(exemplar, tests)
{
	async function _try(method, params, exec)
	{
		try
		{
			exemplar[method](...params);
			return `not found`;

		} catch (e) {
			if (e instanceof exec) return `${exec}`;
			throw e; 
		}
	}

	for (let n=0; n < tests.length; n++)
	{
		let test = tests[n],
			msg  = `\nMethod: ${method} \nError: `;

		msg += await _try(test.method, test.params, test.exec);

		consol.log(msg);
	}
}