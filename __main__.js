const RestClientCLI = require("./bin/lib/cli/console.app.js")["RestClientCLI"];


let argv = process.argv.slice(2, process.argv.length);

if (argv.length > 0)
{
	let config = require('./config.json')[argv[0]];

	if (config)
	{
		const CLI = new RestClientCLI(config);
	} else { throw `Config by index ${argv[0]} not found!`; }
}