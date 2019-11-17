/**
 * STD Gateway
 * @author <a href="mailto:grdvsng@gmail.com">Trishkin Sergey</a>
 */

const readline = require('readline');


class STDGateway
{
    constructor()
    {
        this.activeResponse = false;
    }

    static getDefaultRLInterface()
    {
        return readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    getPassword(prompt)
    {

    }

    _waitResponse(callBack)
    {
        return new Promise(resolve => recolve)
    }

    getActiveResp(clear=false)
    {
        let resp = this.activeResponse;

        if (clear) this.activeResponse = false;

        return resp;
    }

    async waitResponse()
    {
        let self = this;

        if (!this.activeResponse)
        {
            return new Promise((resolve) =>
                { setTimeout(() => { resolve(self.waitResponse.apply(self)) }, 1000);
            });
        } else {
            return this.getActiveResp(true);
        }
    }

    async input(prompt)
    {
        let rl   = STDGateway.getDefaultRLInterface(),
            self = this;

        rl.question(`${prompt}: `, answer =>
        {
            self.activeResponse = answer;

            rl.close();
        });

        return await this.waitResponse();
    }
}


let std = new STDGateway();

std.input("username");

module.exports =
{
    'STDGateway': STDGateway
}