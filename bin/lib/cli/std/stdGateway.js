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
        } else if (index > this.Nodes.length-1) {
            this.cursor = 0;
        } else {
            this.cursor = index;
        }
    }

    move(where)
    {
        let index = this.cursor;

        if (where === 'up') 
        {
            index++;
        } else { index--; }
    
        this.setCursorByIndex(index);
        
        return this.getData();
    }

    up()
    {
        return this.move('up');
    }

    down()
    {
        return this.move('down');
    }

    getData()
    {
        this.nowData = this.Nodes[this.cursor] || "";

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
        this.rl             = STDGateway.getDefaultRLInterface();
    }
}


module.exports =
{
    'STDGateway': STDGateway
}