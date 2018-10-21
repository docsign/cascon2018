# Makefile for setting up the network
# Not running now, but these steps are correct
export FABRIC_CFG_PATH=$(PWD)
export CHANNEL_NAME=signchannel

.PHONY: setnet prepare setenv createchannel

setnet: prepare runnet createchannel

prepare:
	export FABRIC_CFG_PATH=$PWD
	./bin/cryptogen generate --config=./crypto-config.yaml
	./bin/configtxgen -profile OneOrgOrdererGenesis -channelID docsign-sys-channel -outputBlock ./channel-artifacts/genesis.block
	export CHANNEL_NAME=signchannel && ./bin/configtxgen -profile SignChannel -outputCreateChannelTx ./channel-artifacts/channel.tx -channelID $CHANNEL_NAME
	./bin/configtxgen -profile SignChannel -outputAnchorPeersUpdate ./channel-artifacts/MainOrgMSPanchors.tx -channelID $CHANNEL_NAME -asOrg MainOrgMSP
	# ./bin/configtxgen -profile TwoOrgsChannel -outputAnchorPeersUpdate ./channel-artifacts/Org2MSPanchors.tx -channelID $(CHANNEL_NAME) -asOrg Org2MSP

runnet: setenv
	docker-compose -f docker-compose-cli.yaml up
	docker exec -it cli bash


setenv:
	export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/mainorg.docsign.com/users/Admin@mainorg.docsign.com/msp
	export CORE_PEER_ADDRESS=peer0.mainorg.docsign.com:7051
	export CORE_PEER_LOCALMSPID="MainOrgMSP"
	export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/mainorg.docsign.com/peers/peer0.mainorg.docsign.com/tls/ca.crt

createchannel:
	export CHANNEL_NAME=signchannel
	peer channel create -o orderer.docsign.com:7050 -c $CHANNEL_NAME -f ./channel-artifacts/channel.tx --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/docsign.com/orderers/orderer.docsign.com/msp/tlscacerts/tlsca.docsign.com-cert.pem
	peer channel join -b signchannel.block
	# CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.docsign.com/users/Admin@org2.docsign.com/msp CORE_PEER_ADDRESS=peer0.org2.docsign.com:7051 CORE_PEER_LOCALMSPID="Org2MSP" CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.docsign.com/peers/peer0.org2.docsign.com/tls/ca.crt peer channel join -b signchannel.block
	peer channel update -o orderer.docsign.com:7050 -c $CHANNEL_NAME -f ./channel-artifacts/MainOrgMSPanchors.tx --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/docsign.com/orderers/orderer.docsign.com/msp/tlscacerts/tlsca.docsign.com-cert.pem
	# CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.docsign.com/users/Admin@org2.docsign.com/msp CORE_PEER_ADDRESS=peer0.org2.docsign.com:7051 CORE_PEER_LOCALMSPID="Org2MSP" CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.docsign.com/peers/peer0.org2.docsign.com/tls/ca.crt peer channel update -o orderer.docsign.com:7050 -c $(CHANNEL_NAME) -f ./channel-artifacts/Org2MSPanchors.tx --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/docsign.com/orderers/orderer.docsign.com/msp/tlscacerts/tlsca.docsign.com-cert.pem

chaincode:
	# byfn version: peer chaincode install -n mycc -v 1.0 -l node -p /opt/gopath/src/github.com/chaincode/chaincode_example02/node/
	peer chaincode instantiate -o orderer.docsign.com:7050 --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/docsign.com/orderers/orderer.docsign.com/msp/tlscacerts/tlsca.docsign.com-cert.pem -C $CHANNEL_NAME -n mycc -l node -v 1.0 -c '{"Args":["init","a", "100", "b","200"]}' -P "AND ('MainOrgMSP.peer')"
	peer chaincode query -C $CHANNEL_NAME -n mycc -c '{"Args":["query","a"]}'
	
# docker-compose -f $COMPOSE_FILE -f $COMPOSE_FILE_COUCH -f $COMPOSE_FILE_ORG3 down --volumes --remove-orphans
# docker-compose -f docker-compose-cli.yaml down --volumes --remove-orphans