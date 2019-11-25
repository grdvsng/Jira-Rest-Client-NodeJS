import getpass

from sys import stdin
from sys import argv as sys_argv
from base64 import b64encode

class CLI(object):
    
    def __init__(self, type):
        if type == 'text':
            data = self.prompt()
        else:
            data = self.password()

        with open('_stdout', 'w') as file:
            file.write("%s" % data)

    def password(self):
        p = getpass.getpass(prompt="", stream=stdin)
        
        return b64encode(bytes(p, encoding="utf8"))

    def prompt(self):
        data = input()
        
        return data


_argv = sys_argv[1:]

if len(_argv) > 0 and __name__ == '__main__':
    CLI(*_argv)