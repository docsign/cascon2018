export FABRIC_CFG_PATH=$PWD
docker exec -it cli bash -c 'export CHANNEL_NAME=signchannel && echo $CHANNEL_NAME && peer chaincode invoke -o orderer.docsign.com:7050 --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/docsign.com/orderers/orderer.docsign.com/msp/tlscacerts/tlsca.docsign.com-cert.pem -C $CHANNEL_NAME -n doccc -c '\''{"Args":["put", "test_key", "test_value"]}'\'' && exit'

