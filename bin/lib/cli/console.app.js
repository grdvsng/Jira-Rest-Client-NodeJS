/**
 * Module for creation uneversal CLI for Rest Api Client
 * @author <a href="mailto:grdvsng@gmail.com">Trishkin Sergey</a>
 * @version 1.0.0
 */

const os_path = require('path');


class UserInputParser
{
	constructor()
	{
		this.supported = require("./config.cli.json");
	}

	getCommandByLessName(lessName)
	{
		for (var k in this.supported)
		{
			if (this.supported[k].less === lessName)
			{	
				return { name: k, cfg: this.supported[k].argv };
			}
		}
	}

	getCommandCfg(data)
	{
		let curdata = data || { params:[], require:[] };

		curdata.require = curdata.require || [];
		curdata.params  = curdata.params  || curdata.require;

		return curdata;
	}

	getCommand(key)
	{
		let command; 

		if (this.supported[key])
		{
			command = { name: key, cfg: this.supported[key].argv }
		} else { command = this.getCommandByLessName(key); }

		if (!command) throw `Key: '${key}' not found.`;

		command.cfg = this.getCommandCfg(command.cfg);

		return command;
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
			if (userArgv.indexOf(methodRequire[n]) === -1)
			{
				console.log(userArgv.indexOf(methodRequire[n]) === -1, userArgv.indexOf(methodRequire[n]))
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
		} else if (method_params.name === 'help') {
			return [argv[0]];
		} else {
			return this._getArgv(argv, method_params.cfg);
		}
	}

	parseUserInput(input)
	{
		let splited = input.split(" "),
			command = this.getCommand(splited[0]),
			argv    = this.getArgv(splited.slice(1, splited.length), command);
	
		return { method: command, argv: argv };
	}

	getCliData(_type='text', prompt='$cli_jira> ')
	{
		let pid  = require('child_process').spawn(`py`, [ `${__dirname}/cli.py`, _type ], {stdio: [0, 1, 2]});
		
		process.stdout.write(prompt);

		return new Promise(resolve => pid.on('close', code => resolve(this.readStdout(_type !== 'text'))));
	}
}


class RestClientCLI extends UserInputParser
{
	constructor(config)
	{
		super();
		this.config = config;

		this.connectConfigs().then(() => this.mainLoop());
	}

	mergeSupported()
	{
		if (this.client.supported)
		{
			this.client.supported.exit = this.supported.exit;
			this.client.supported.help = this.supported.help;
			this.supported             = this.client.supported;
		}
	}

	connectConfigs()
	{
		let auth = this.config.auth;
		
		auth      = (auth) ? auth:{"type": "basic"};
		auth.data = (auth.data) ? auth.data:{};
		
		return new Promise (async (resolve) => 
		{

			this.client = await this.setClient();
			
			this.mergeSupported();
			resolve(true);
		});
	}

	async setClient()
	{
		let cls = (this.config.client) ? require(os_path.resolve(this.config.client))["JiraClient"]:require("../../JiraClient")["JiraClient"];

		delete this.config.client;

		let client = new cls(this.config);
		
		await client.run();

		return client;
	}

	getMethodHelp(method)
	{
		let help = this.supported[method.name].help || 'Sory, help for method not created =(';
	
		return help;
	}

	getHelpForAllSuportMethods()
	{
		let help = '';

		for (let k in this.supported)
		{
			let line = this.supported[k].help || `Method: '${k}' - help not found.`;

			help += line + "\n" + "-".repeat(50) + "\n";
		}

		return help;
	}

	getHelp(methodParams)
	{
		let help;

		if (methodParams.method.name === 'help' && methodParams.argv[0]) 
		{
			help = this.getMethodHelp(this.getCommand(methodParams.argv[0]));
		} else if (methodParams.argv[0]) {
			help = this.getMethodHelp(this.getCommand(methodParams.method.name));
		} else { help = this.getHelpForAllSuportMethods(); }

		console.log(help);
	}

	isClientSupprotMethod(methodName)
	{
		if (typeof (this.client[methodName] || this.client[methodName.match(/[\w]+(?=_)/gi)[0]])  === "function")
		{
			return true;
		}
	}

	async callClientMethod(methodName, args)
	{
		let supported = this.isClientSupprotMethod(methodName);
		
		if (supported)
		{
			return await this.client._methods_parser(methodName, args);
		} else {
			throw `Method '${methodName}' is not supported in client.` 
		}
	}

	async compileParams(methodParams)
	{
		if (methodParams.argv === 'help' || methodParams.method.name === 'help') 
		{ 
			return this.getHelp(methodParams);
		} else if (methodParams.method.name === 'exit') { 
			process.exit(1); 
		} else { 
			return await this.callClientMethod(methodParams.method.name, methodParams.argv); 
		}
	}

	readStdout(encode=false)
	{
		let fs   = require('fs'),
			data = fs.readFileSync("_stdout", 'utf8');

		if (encode) data = Buffer.from(data.substring(2, data.length-1), 'base64').toString();
		
		fs.unlinkSync("_stdout");
		
		return data;
	}

	async mainLoop()
	{
		try 
		{
			let input        = await this.getCliData(),
				methodParams = this.parseUserInput(input);
			await this.compileParams(methodParams);

		} catch(e) { console.log(e); }

		this.mainLoop();
	}
}


module.exports =
{
	'RestClientCLI': RestClientCLI,
	'UserInputParser': UserInputParser
}