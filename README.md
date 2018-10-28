# cascon2018

Code Repository of Document Signing Blockchain App for IBM CASCON 2018

## Current status

Chaincode works now!

Middleware (from Jackie) should work, but I (Eric) didn't know how to run it correctly.

Need a front-end command interface to process the business logic:
- Take user input (pdf file, public key, private key, etc.)
- Convert the pdf file to a hash if necessary (There is exiting library to do that)
- Store the key-value pairs properly to the chain (via calling functions in middleware)
- Verify the key-value pairs from the chain (via calling functions in middleware)

## New Section: How to use chaincode?

I have installed and instantiate our chaincode (docsign/node/docsign.js) to the signchannel with the name "doccc". Note that the "mycc" is not the correct chaincode to use! Use "doccc" as the chaincode name.

You don't need to install or instantiate any more. Try the following two commands in cli to verify the chaincode functionalities:

```bash
# First start the network with docker-compose (see instructions below)

# Then, start cli
cd cascon2018
export FABRIC_CFG_PATH=$PWD
docker exec -it cli bash
export CHANNEL_NAME=signchannel

# You can invoke the "put" function in chaincode to add key-value pair, change the args in the command below
peer chaincode invoke -o orderer.docsign.com:7050 --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/docsign.com/orderers/orderer.docsign.com/msp/tlscacerts/tlsca.docsign.com-cert.pem -C $CHANNEL_NAME -n doccc -c '{"Args":["put", "test_key", "test_value"]}'
# Now, you can query the value you just wrote based on the key
peer chaincode query -o orderer.docsign.com:7050 --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/docsign.com/orderers/orderer.docsign.com/msp/tlscacerts/tlsca.docsign.com-cert.pem -C $CHANNEL_NAME -n doccc -c '{"Args":["get", "test_key"]}'

# If you insert the same key with different value - the old value will be overwritten by the new value !!!
```

## File structure
cascon2018 - main repo

backup_oldfiles, saved, saved2 - not useful, don't need to touch

sample, fabric-sample - samples from fabric, can be used as reference. fabric-sample is up-to-date

base, chaincode, configtx.yaml, crypto-config.yaml, docker-compose-cli.yaml and .env - useful files

docker-compose-cli.yaml is the entry point for starting the network

base, configtx.yaml, crypto-config.yaml define the structure of the network

chaincode contains the developed chaincode

.env sets the enviroment, don't need to worry

app - used to store the middleware logic

## Set Up Network & Network Architecture

To start the network (docsign) when you just ctrl+c last time to exit the network (i.e. you didn't remove the containers and not from scratch):

```bash
Go to cascon2018
export FABRIC_CFG_PATH=$PWD
export CHANNEL_NAME=signchannel
docker-compose -f docker-compose-cli.yaml up
```

Then, you can open another terminal and run cli to operate the network and install/instantiate chaincode!

```bash
docker exec -it cli bash
```

I suggest you read (https://hyperledger-fabric.readthedocs.io/en/latest/write_first_app.html) and (https://hyperledger-fabric.readthedocs.io/en/latest/developing_applications.html) and (https://hyperledger-fabric.readthedocs.io/en/latest/chaincode.html) for the chaincode development~

### Steps to run the network from scratch

#### Run the following commands one by one will create a new network from scratch (Tested and Working!) (Please follow the steps and try!)

```bash
# Clean up all old files/containers
cd cascon2018
docker-compose -f docker-compose-cli.yaml down --volumes --remove-orphans
docker rm -f $(docker ps -aq)
docker network prune
rm -rf crypto-config
cd channel-artifacts && rm -rf *
cd ..

# If want to delete old chaincode image (for reinstalling chaincode), try "docker image ls" to see which image is still there and delete them, ex:
docker image ls
docker rmi dev-peer0.mainorg.docsign.com-mycc-1.0-712d857ef2a30f72816248be4a87f16f15c271ca967246fcda0eee3c1e11b15f

# Create the crypto keys & network artifacts
export FABRIC_CFG_PATH=$PWD
export CHANNEL_NAME=signchannel
./bin/cryptogen generate --config=./crypto-config.yaml
./bin/configtxgen -profile OneOrgOrdererGenesis -channelID docsign-sys-channel -outputBlock ./channel-artifacts/genesis.block
export CHANNEL_NAME=signchannel && ./bin/configtxgen -profile SignChannel -outputCreateChannelTx ./channel-artifacts/channel.tx -channelID $CHANNEL_NAME
./bin/configtxgen -profile SignChannel -outputAnchorPeersUpdate ./channel-artifacts/MainOrgMSPanchors.tx -channelID $CHANNEL_NAME -asOrg MainOrgMSP

# Setup some env variables
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/mainorg.docsign.com/users/Admin@mainorg.docsign.com/msp
export CORE_PEER_ADDRESS=peer0.mainorg.docsign.com:7051
export CORE_PEER_LOCALMSPID="MainOrgMSP"
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/mainorg.docsign.com/peers/peer0.mainorg.docsign.com/tls/ca.crt

# Run the network
docker-compose -f docker-compose-cli.yaml up

# Open another terminal to enter cli
cd cascon2018
export FABRIC_CFG_PATH=$PWD
docker exec -it cli bash

# Use the second terminal (cli) to create channel
export CHANNEL_NAME=signchannel
peer channel create -o orderer.docsign.com:7050 -c $CHANNEL_NAME -f ./channel-artifacts/channel.tx --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/docsign.com/orderers/orderer.docsign.com/msp/tlscacerts/tlsca.docsign.com-cert.pem
peer channel join -b signchannel.block
peer channel update -o orderer.docsign.com:7050 -c $CHANNEL_NAME -f ./channel-artifacts/MainOrgMSPanchors.tx --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/docsign.com/orderers/orderer.docsign.com/msp/tlscacerts/tlsca.docsign.com-cert.pem

# Install chaincode (example version)
peer chaincode install -n mycc -v 1.0 -l node -p /opt/gopath/src/github.com/chaincode/chaincode_example02/node/
peer chaincode instantiate -o orderer.docsign.com:7050 --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/docsign.com/orderers/orderer.docsign.com/msp/tlscacerts/tlsca.docsign.com-cert.pem -C $CHANNEL_NAME -n mycc -l node -v 1.0 -c '{"Args":["init","a", "100", "b","200"]}' -P "AND ('MainOrgMSP.peer')"
peer chaincode query -C $CHANNEL_NAME -n mycc -c '{"Args":["query","a"]}'

# Install chaincode (our chaincode) (Working version!)
peer chaincode install -n doccc -v 1.0 -l node -p /opt/gopath/src/github.com/chaincode/docsign/node/
peer chaincode instantiate -o orderer.docsign.com:7050 --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/docsign.com/orderers/orderer.docsign.com/msp/tlscacerts/tlsca.docsign.com-cert.pem -C $CHANNEL_NAME -n doccc -l node -v 1.0 -c '{"Args":[]}' -P "AND ('MainOrgMSP.peer')"
# Now, you can invoke the "put" function in chaincode to add key-value pair, change the args in the command below
peer chaincode invoke -o orderer.docsign.com:7050 --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/docsign.com/orderers/orderer.docsign.com/msp/tlscacerts/tlsca.docsign.com-cert.pem -C $CHANNEL_NAME -n doccc -c '{"Args":["put", "test_key", "test_value"]}'
# Now, you can query the value you just wrote based on the key
peer chaincode query -o orderer.docsign.com:7050 --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/docsign.com/orderers/orderer.docsign.com/msp/tlscacerts/tlsca.docsign.com-cert.pem -C $CHANNEL_NAME -n doccc -c '{"Args":["get", "test_key"]}'

# To stop the network
ctrl+c in the first terminal running the network

# If want to restart - need to delete containers & files
docker-compose -f docker-compose-cli.yaml down --volumes --remove-orphans
docker rm -f $(docker ps -aq)
rm -rf crypto-config
cd channel-artifacts && rm -rf *
cd ..

# To delete the installed chaincode
Need to enter the peer node’s container (cli) !!! - Fabric has not complete this part!
docker rm -f <container id>
rm /var/hyperledger/production/chaincodes/<ccname>:<ccversion>
# If want to delete old chaincode image (for reinstalling chaincode), try "docker image ls" to see which image is still there and delete them, ex:
docker image ls
docker rmi dev-peer0.mainorg.docsign.com-mycc-1.0-712d857ef2a30f72816248be4a87f16f15c271ca967246fcda0eee3c1e11b15f
```

## Old Stuff (Just for reference, don't try these)

### From Sample

#### Generate crypto materials

```bash
./bin/cryptogen generate --config=./crypto-config.yaml
```

#### Generate configuration artifacts

1. Get artifacts

```shell
export FABRIC_CFG_PATH=$PWD
./bin/configtxgen -profile TwoOrgsOrdererGenesis -channelID byfn-sys-channel -outputBlock ./channel-artifacts/genesis.block
```

2. Create a channel configuration transaction

```bash
The channel.tx artifact contains the definitions for our sample channel

export CHANNEL_NAME=signchannel  && ./bin/configtxgen -profile TwoOrgsChannel -outputCreateChannelTx ./channel-artifacts/channel.tx -channelID $CHANNEL_NAME
./bin/configtxgen -profile TwoOrgsChannel -outputAnchorPeersUpdate ./channel-artifacts/Org1MSPanchors.tx -channelID $CHANNEL_NAME -asOrg Org1MSP
./bin/configtxgen -profile TwoOrgsChannel -outputAnchorPeersUpdate ./channel-artifacts/Org2MSPanchors.tx -channelID $CHANNEL_NAME -asOrg Org2MSP
```

#### Run the network

1. Start the network (orderer)

```bash
docker-compose -f docker-compose-cli.yaml up -d
```

2. To use peer0

```bash
Set up environment variables for PEER0

export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=peer0.org1.example.com:7051
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
```

3. Go to cli

```bash
docker exec -it cli bash
```

4. Create a channel

```bash
export CHANNEL_NAME=signchannel
peer channel create -o orderer.example.com:7050 -c $CHANNEL_NAME -f ./channel-artifacts/channel.tx --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem
```

5. Join a peer to the channel

```bash
peer channel join -b signchannel.block
```

6. Join another peer to the channel

```bash
CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp CORE_PEER_ADDRESS=peer0.org2.example.com:7051 CORE_PEER_LOCALMSPID="Org2MSP" CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt peer channel join -b signchannel.block
```

7. Define the anchor peers

```bash
peer channel update -o orderer.example.com:7050 -c $CHANNEL_NAME -f ./channel-artifacts/Org1MSPanchors.tx --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem

CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp CORE_PEER_ADDRESS=peer0.org2.example.com:7051 CORE_PEER_LOCALMSPID="Org2MSP" CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt peer channel update -o orderer.example.com:7050 -c $CHANNEL_NAME -f ./channel-artifacts/Org2MSPanchors.tx --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem
```

#### Run the chaincode

1. Install the node chaincode

```bash
peer chaincode install -n mycc -v 1.0 -l node -p /opt/gopath/src/github.com/chaincode/chaincode_example02/node/
```

2. Instantiation

```bash
# be sure to replace the $CHANNEL_NAME environment variable if you have not exported it
# if you did not install your chaincode with a name of mycc, then modify that argument as well
# notice that we must pass the -l flag after the chaincode name to identify the language
# -P specifies the endorsement policy

peer chaincode instantiate -o orderer.example.com:7050 --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem -C $CHANNEL_NAME -n mycc -l node -v 1.0 -c '{"Args":["init","a", "100", "b","200"]}' -P "AND ('Org1MSP.peer','Org2MSP.peer')"
```

3. Try the chaincode

```bash
#Query

peer chaincode query -C $CHANNEL_NAME -n mycc -c '{"Args":["query","a"]}'

#Invoke

peer chaincode invoke -o orderer.example.com:7050 --tls true --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem -C $CHANNEL_NAME -n mycc --peerAddresses peer0.org1.example.com:7051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt --peerAddresses peer0.org2.example.com:7051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt -c '{"Args":["invoke","a","b","10"]}'
```