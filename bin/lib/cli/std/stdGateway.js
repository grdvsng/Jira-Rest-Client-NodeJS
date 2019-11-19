/**
 * STD Gateway
 * @author <a href="mailto:grdvsng@gmail.com">Trishkin Sergey</a>
 */

const readline = require('readline');


class FSGateway 
{   
    constructor()
    {
        let fso = require('fs');

        this.readFile = path         => { return fso.readFileSync(path) };
        this.write    = (path, data) => { fso.writeFileSync(path, data) };
        this.exists   = path         => { return fso.existsSync(path)   };
        this.nowData  = "";
    }
}


class History extends FSGateway
{
    constructor(filePath)
    {
        super();

        this.path   = filePath;
        this.Nodes  = this.getNodes(filePath);
        this.cursor = this.setCursor();
    }

    getNodes()
    {
        if (!this.exists(this.path)) 
        {
            this.write(this.path, JSON.stringify([]));
        }

        return require(this.path);
    }

    push(data)
    {
        this.Nodes.push(data);
        
        this.Nodes  = Array.from(new Set(this.Nodes));
        this.cursor = this.setCursor();

        this.write(this.path, JSON.stringify(this.Nodes));
    }

    setCursor()
    {
        this.cursor = (this.Nodes.length === 0) ? 0:this.Nodes.length-1;

        return this.cursor;
    }

    setCursorByIndex(index)
    {
        if (index < 0)
        {
            this.cursor = this.Nodes.length-1;
        } else if (index === this.Nodes.length) {
            this.cursor = 0;
        } else {
            this.cursor = index;
        }
    }

    move(where)
    {
        let index = this.cursor;

        if (this.nowData !== "")
        {
            if (where === 'up') 
            {
                index++;
            } else { index--; }
        }
    
        this.setCursorByIndex(index);
        
        return this.getData(index);
    }

    up()
    {
        return this.move('up');
    }

    down()
    {
        return this.move('down');
    }

    getData(index)
    {
        if (index != this.cursor) 
        {
            this.nowData = "";
        } else {
            this.nowData = this.Nodes[this.cursor];
        }

        return this.nowData;
    }
}


class STDGateway
{
    constructor()
    {
        this.historyPath    = `${__dirname}/history.json`;
        this.activeResponse = false;
        this.history        = new History(this.historyPath);

        this.connectControllers();
    }

    onHistoryMove(direction)
    {
        process.stdout.clearLine();
        process.stdout.cursorTo(0);

        if (direction === 'down')
        {
            process.stdout.write((this.prompt || "") + this.history.down());
        } else {
            process.stdout.write((this.prompt || "") + this.history.up());
        }
    }

    onkeypress(key)
    {
        if (key.name === 'down' || key.name === 'up')
        {
            this.onHistoryMove(key.name)
        }
    }
    
    connectControllers()
    {
        process.stdin.on('keypress', (c, k) => this.onkeypress.apply(this, [k]));
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
        this.connectControllers();

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

        this.prompt = `${prompt}> `;

        rl.question(this.prompt, answer =>
        {
            self.activeResponse = answer;

            self.history.push(answer);
            rl.close();
        });

        return await new Promise(resolve => resolve(this.waitResponse()));
    }
}


module.exports =
{
    'STDGateway': STDGateway
}