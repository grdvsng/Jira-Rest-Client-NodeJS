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

    static handleKeyEvent(keyName, data)
    {
        if (keyName === 'return') 
        {
            process.stdin.pause();
            return data;

        } else if (keyName=== 'backspace') {
            return data.slice(0, data.length - 1);
        }
        
        return data; // Else
    }

    static printPasswordStdout(prompt, password)
    {
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        process.stdout.write(`${prompt}> ${"*".repeat(password.length)}\n`);
    }

    static OnPassword(chunk, key, prompt, password)
    {
        if (key && key.name != 'return' && key.name != 'backspace' && chunk)
        {
            password += chunk;
        } else { 
            password = STDGateway.handleKeyEvent(key.name, password); 
        }
        
        STDGateway.printPasswordStdout(prompt, password);

        return password;
    }

    onPasswordReady(password, rl)
    {
        process.stdin.removeAllListeners('keypress');
        process.stdin.removeAllListeners('pause');
        
        rl.close();

        this.activeResponse = password;
    }

    async getPassword(prompt)
    {
        let password = "",
            rl       = STDGateway.getDefaultRLInterface();
        
        process.stdin.resume();
        process.stdin.setEncoding('utf8');
        process.stdin.on('keypress', (chunk, key) => { password = STDGateway.OnPassword(chunk, key, prompt, password); });
        process.stdin.on('pause', () => this.onPasswordReady(password, rl));
        
        rl.prompt();
        STDGateway.printPasswordStdout(prompt, password);
        
        return await this.waitResponse();
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
            return await new Promise(resolve => resolve(this.getActiveResp(true)));
        }
    }

    async input(prompt)
    {
        let rl   = STDGateway.getDefaultRLInterface(),
            self = this;

        rl.question(`${prompt}> `, answer =>
        {
            self.activeResponse = answer;

            rl.close();
        });

        return await new Promise(resolve => resolve(this.waitResponse()));
    }
}


module.exports =
{
    'STDGateway': STDGateway
}