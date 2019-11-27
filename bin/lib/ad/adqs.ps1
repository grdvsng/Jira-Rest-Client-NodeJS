[Console]::OutputEncoding = [System.Text.Encoding]::UTF8


function ADTableConnection([string]$selector, [string]$sqlCondition)
{
    [object] $ADconnection;
    [object] $Commander;
    [string] $rootDomainNamingContext;

    function generateCollectioFromFields([__ComObject]$objRecordSet)
    {
        [object]$request = @{};
        [int]$n          = -1;

        forEach ($field in $objRecordSet.Fields)
        {
            $request[$field.Name] = $field.Value;
            $n += 1;
        }

        return $request;
    }

    function requests([object]$ADconnection, [object]$Commander, [string]$rootDomainNamingContext, [string]$selector, [string]$sqlCondition)
    {
        [string]$Commander.CommandText = "SELECT " + $selector + " FROM 'LDAP://" + $rootDomainNamingContext +"' WHERE " + $sqlCondition;
        [object]$objRecordSet               = $Commander.Execute();
        [array]$keys                        = $selector -split ", ";
        $result                             = $null;
        
        if ($objRecordSet.Fields.Count -eq 1) 
        {
            return $objRecordSet.Fields(0).Value
        } else {
            return generateCollectioFromFields $objRecordSet;
        }
    } 

    function connect([object]$ADconnection, [object]$Commander)
    {
        $ADconnection.Open( "Active Directory Provider");
        
        [object]$Commander.ActiveConnection                  = $ADconnection;
        [int]$Commander.Properties.item("Searchscope").value = 2; #subTree
    }

    $ADconnection            = new-Object -com "ADODB.Connection";
    $Commander               = new-Object -com "ADODB.Command";
    $rootDomainNamingContext = ([ADSI]"LDAP://RootDSE").rootDomainNamingContext;   
    $ADconnection.Provider   = "ADsDSOObject";

    connect $ADconnection $Commander;
    return requests $ADconnection $Commander $rootDomainNamingContext $selector $sqlCondition

}


if ($args[0])
{ 
    [string]$query = $args[0];
    $data          = ADTableConnection 'displayName, sAMAccountName, extensionName, mail' "$query";
    [int]$step     = 2;
    
    write-Output "{"
    forEach ($key in $data.Keys)
    {
        [string]$value = $data.$key
        [string]$line  = "`t`"$key`": `"$value`"";
        
        if ($step -le 4) 
        {
            $line = $line + ","
        }
        
        write-Output $line
        
        $step = $step + 1;
    }

    write-Output "}"
}
