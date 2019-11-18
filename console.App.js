/**
 * Console client for Jira
 * @author <a href="mailto:grdvsng@gmail.com">Trishkin Sergey</a>
 * @version 0.1.0
 */


const config = require('./config.json')[0]; // Univerasal Jira
const STDGateway = new (require("./bin/STDGateway")["STDGateway"])();


class UserInputParser
{
	constructor()
	{
		this.supported = require("./config.cli.json");
	}

	getCommand(key)
	{
		for (let k in this.supported)
		{
			if (this.supported[key] || this.supported[k].less === key)
			{
				return { name: k, cfg: this.supported[k].argv };
			}
		}

		throw `Key: '${key}' not found.`; // not finded
	}

	sortByArgv(notSortedObject, params)
	{
		var argv = [];

		for (let n=0; n < params.length; n++)
		{
			let arg = notSortedObject[params[n]] || undefined;

			argv.push(arg);
		}

		return argv;
	}

	checkRequire(userArgv, methodRequire)
	{
		for (let n=0; n < methodRequire.length; n++)
		{
			if (userArgv.indexOf(methodRequire[n]) === -1 || !userArgv.indexOf(methodRequire[n]))
			{
				throw `Param: '${methodRequire[n]}' is require.`;
			}
		}

		return true;
	}

	_getArgv(argv, method_params)
	{
		let _argv = {};

		this.checkRequire(argv, method_params.require);

		for (let n=0; n < argv.length; n++)
		{
			if (n === 0 || Math.round(n / 2) === n / 2 )
			{
				if (n + 1 < argv.length) 
				{
					_argv[argv[n]] = argv[n+1];
				} else { _argv[argv[n]] = null; }
			}
		}

		return this.sortByArgv(_argv, method_params.params);
	}

	getArgv(argv, method_params)
	{
		if (argv[0] === 'help' || argv[0] === '-h') 
		{
			return 'help';
		} else {
			return this._getArgv(argv, method_params);
		}
	}

	parseUserInput(input)
	{
		let splited = input.split(" "),
			command = this.getCommand(splited[0]),
			argv    = this.getArgv(splited.slice(1, splited.length), command.cfg);
		
		return { method: command, argv: argv };
	}
}


class JiraCLI extends UserInputParser
{
	constructor(config)
	{
		super();
		this.config = config;

		//this.connectConfigs();
	}

	async connectConfigs()
	{
		let auth = this.config.auth;

		auth               = (auth) ? auth:{"type": "basic"};
		auth.data          = (auth.data) ? auth.data:{};
		auth.data.username = (this.config.username) ? this.config.username:await STDGateway.input("username");
		auth.data.password = (this.config.password) ? this.config.password:await STDGateway.getPassword("password");
		
		return this.setClient();
	}

	async setClient()
	{
		let client = (this.config.client) ? require(this.config.client)["JiraClient"]:require("./bin/JiraClient")["JiraClient"];
		
		delete this.config.client;

		this.client = await new client();

		return true;
	}

	async mainLoop()
	{
		try {
			let methodParams = this.parseUserInput(await STDGateway.input("$jiraCLI")),
				help         = this.supported[methodParams.method.name].help || 'Help for method not found =(';

			if (methodParams.argv === 'help')
			{ 
				console.log(help); 
			} else { }
		} catch(e) { console.log(e); }

		this.mainLoop();
	}
}

const cli = new JiraCLI(config);
cli.mainLoop();
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

