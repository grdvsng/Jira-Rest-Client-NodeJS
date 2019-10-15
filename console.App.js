/**
 * Console client for Jira
 * @author <a href="mailto:grdvsng@gmail.com">Trishkin Sergey</a>
 * @version 0.1.0
 */

/*
	new Test('_request',            [{path: "rest/api/2/search", data: {jql: "",startAt: 0, maxResults: 50}}]),
	new Test('search',              ["project = Test And resolution = Unresolved", 0, 50]),
	new Test('getIsue',             ['Test-1']),
	new Test('createUser',          [{"displayName":  "John Travolta", "name": "scientology666", "applicationKeys": []}]),
	new Test('getUser',             ["scientology666"]),
	new Test('getProjectRoles',     ["Test"]),
	new Test('getRoleId',           ["Administrator", "Test"]),
	new Test('addUserInProject',    ["scientology666", "Test", "Administrator"]),
	new Test('addUserInGroup',      ["scientology666", "jira-software-users"]),
	new Test('removeUserFromGroup', ["scientology666", "jira-software-users"]),
	new Test('generateBasicAuth',   ["project = Test And resolution = Unresolved", 0, 50]),
	new Test('createSession',       ["project = Test And resolution = Unresolved", 0, 50]),
	new Test('deleteUser',          ["scientology666"])
*/

class ClientGateway extends require('./bin/JiraClient')['JiraClient']
{
	
	constructor(parameters, auth)
	{
		super(parameters, auth)
	}
}

class Autonomous/*extends ClientGateway*/
{
	
	constructor(argv)
	{

//-cmd "getIsue" -args [1, 2, 4, 5] -host "loacalhost:8080" -auth admin:admin -log "./tests/console.test.log"
		//super(args);
		if(argv.indexOf(cfg) !== -1)
		{
			this.parseCFG(argv[1]);
		} else {
			this.parseUserCmd(argv);	
		}
	}

	parseUserCmd(argv)
	{
		let required = 
		[
			'-args',
			'-host',
			'-auth'
		];

		required.forEach((val) =>
		{
			if (argv.indexOf(val) === - 1)
			{
				throw new Error(`Param: '${val}' is required.`)
			}
		});
	}
}


const __argv__ = Array.from(process.argv).slice(2,);

if (__argv__.length > 0)
{
	new Autonomous(__argv__);
} else {

}
//var stdin = process.openStdin(argv);