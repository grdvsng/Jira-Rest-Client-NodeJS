/**
 * Module for creation uneversal CLI for Rest Api Client
 * @author <a href="mailto:grdvsng@gmail.com">Trishkin Sergey</a>
 * @version 1.0.0
 */

const child_process = require('child_process');

class ADGateway
{
    static async search(query, converter)
    {
        var self = this;
        
        await child_process.exec(`powershell -f "${__dirname}/adqs.ps1" "${query}"`, (error, stdout) =>
        {  
            if (error) throw new Error(error.code);
    
            self.actualData = stdout;
        }); 

        let resp = await this.wait_response();
        this.actualData = undefined;

        return new Promise(resolve => resolve((converter) ? converter(resp):resp));
    }

    static async searchUser(userName, converter)
    { 
        var resp = await this.search(`displayName = '${userName}' or sAMAccountName = '${userName}'`, converter);

        return new Promise(resolve => resolve(resp));
    }

    static async wait_response()
	{
		if (!this.actualData)
		{
			await new Promise(resolve => {setTimeout(resolve, 1000);});

			return this.wait_response();
		}
        
        let data = this.actualData;

		return new Promise(resolve => resolve(JSON.parse(data)));
	}
}


module.exports =
{
	'ADGateway': ADGateway
}