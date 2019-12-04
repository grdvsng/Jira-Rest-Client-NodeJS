/**
 * Example client for jira app
 */


const _JiraClient = require("../../bin/JiraClient")["JiraClient"];
const UserInputParser = require("../../bin/lib/cli/console.app")["UserInputParser"];


class JiraClient extends UserInputParser
{
    constructor(parameters)
    {
        super();
        
        this.connections = parameters.connections;
        this.clients     = {};
        this.supported   = require("./myCompany.json");
    }

    async run()
    {

        for (let n=0; n < this.connections.length; n++)
        {
            let connection = this.connections[n];

            connection.params.auth.data.username = connection.params.auth.data.username ? connection.params.auth.data.username:await this.getCliData("text", "username > ");
			connection.params.auth.data.password = connection.params.auth.data.password ? connection.params.auth.data.password:await this.getCliData("pass", "password > ");
            this.clients[connection.title]       = new _JiraClient(connection.params);

            await this.clients[connection.title].run();
        }
    }

    async getUser(userName)
    {
        let userData = await this.getUser(userName);

        if (userData) console.log(userData);
    }

    async createUser_JiraDev()
    {

    }
    
    async _methods_parser(methodName, args)
    {
        let client = this.clients[this.supported[methodName].client];

        if (!this[methodName])
        {
            await this[methodName.match(/[\w]+(?=_)/gi)[0]].apply(client, args);
        } else {
            await this[methodName].apply(client, args);
        }
    }
}

module.exports = 
{
    "JiraClient": JiraClient
}