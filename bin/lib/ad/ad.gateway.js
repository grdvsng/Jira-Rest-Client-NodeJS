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
        return new Promise((resolve, reject) => 
        {
            child_process.exec(`powershell -f "${__dirname}/adqs.ps1" "${query}"`, (error, stdout) =>
            
            {  
                if (error) reject(new Error(error.code));
        
                resolve((converter) ? converter(stdout):stdout);
            }); 
        });
    }

    static async searchUser(userName, converter)
    { 
        var resp = await this.search(`displayName = '${userName}' or sAMAccountName = '${userName}'`, converter);

        return resp;
    }
}


module.exports =
{
	'ADGateway': ADGateway
}