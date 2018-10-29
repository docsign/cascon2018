# This is the "front end" of our application
# In the interest of time, it uses the CLI to interact with the chaincode
import hashlib
import os
from cmd import Cmd

class MyPrompt(Cmd):

    def do_sign_document(self, args):
        """Sign a document
        Arguments: document_name string, signature string
        """
        docName = "";
        signature = "";
        splitArgs = args.split(" ")
        if len(splitArgs) < 2:
            print "Need to provide document name and signature."
        elif len(splitArgs) == 2:
            docName = splitArgs[0]
            signature = splitArgs[1]
            print "DocName is " + docName
            print "Signature is " + signature
            hashedDoc = hashPDF(docName)
            print hashedDoc
            signDoc(hashedDoc, signature)
        else:
            print "Wrong number of arguments."

    def query_document(self, args):
        splitArgs = args.split(" ")


    def do_quit(self, args):
        """Quits the program."""
        print "Quitting."
        raise SystemExit


def hashPDF(docName):
    """Hash a PDF document"""
    BLOCKSIZE = 65536
    hasher = hashlib.sha1()
    with open(docName, 'rb') as afile:
        buf = afile.read(BLOCKSIZE)
        while len(buf) > 0:
            hasher.update(buf)
            buf = afile.read(BLOCKSIZE)
    return hasher.hexdigest()


def signDoc(hashedDoc, signature):
    """Put the hashed document in the database"""
    # command = "export FABRIC_CFG_PATH=$PWD && docker exec -it cli bash"
    # command += " && export CHANNEL_NAME=signchannel && echo $CHANNEL_NAME"
    # command += " && peer chaincode invoke -o orderer.docsign.com:7050"
    # command += "--tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/docsign.com/orderers/orderer.docsign.com/msp/tlscacerts/tlsca.docsign.com-cert.pem"
    # command += " -C $CHANNEL_NAME -n doccc -c"
    # command += "'{\"Args\":[\"put\"," + "\"" + hashedDoc + "\",\"" + signature + "\"]}'"
    os.system(". signDoc.sh")


def queryForDoc():
    """"""
    pass


def openCLI():
    print "calling openCLI"


if __name__ == '__main__':
    prompt = MyPrompt()
    prompt.prompt = '> '
    prompt.cmdloop('Welcome to Document Signing on Blockchain...')
