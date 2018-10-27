var Fabric_Client = require('fabric-client');

var path = require('path');
var util = require('util');
var os = require('os');

var fabric_client = new Fabric_Client();
var fabric_ca_client = null;
var member_user = null;
var store_path = path.join(__dirname, 'hfc-key-store');
console.log(' Store path:'+store_path);


Fabric_Client.newDefaultKeyValueStore({ path: store_path
}).then((state_store) => {
     // assign the store to the fabric client
     fabric_client.setStateStore(state_store);
     var crypto_suite = Fabric_Client.newCryptoSuite();
     // use the same location for the state store (where the users' certificate are kept)
     // and the crypto store (where the users' keys are kept)
     var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
     crypto_suite.setCryptoKeyStore(crypto_store);
     fabric_client.setCryptoSuite(crypto_suite);
     var	tlsOptions = {
    	trustedRoots: [],
    	verify: false
     };
     
     // first check to see if user is already enrolled
}).then((user_from_store) => {
    if (user_from_store && user_from_store.isEnrolled()) {
        console.log('Successfully loaded user from persistence');
        member_user = user_from_store;
        return null;
    } 
    else {
	 // need to enroll it with CA server
	return fabric_client.createUser({
		username: 'User1',
                mspid: 'MainOrgMSP',
                cryptoContent: { 
			privateKey: '/home/student/cascon2018/crypto-config/peerOrganizations/mainorg.docsign.com/users/User1@mainorg.docsign.com/msp/keystore/4f611a452b0449cda420b914bff1234cc41fd04e835b33ae1447fdd0c9dff948_sk', 
			signedCert: '/home/student/cascon2018/crypto-config/peerOrganizations/mainorg.docsign.com/users/User1@mainorg.docsign.com/msp/signcerts/User1@mainorg.docsign.com-cert.pem'}
         }).then((user) => {
            member_user = user;
            return fabric_client.setUserContext(member_user);
         }).catch((err) => {
          console.error('Failed to enroll and persist member. Error: ' + err.stack ? err.stack : err);
          throw new Error('Failed to enroll member');
        });
    }
}).then(() => {
    console.log('Assigned the member user to the fabric client ::' + member_user.toString());
}).catch((err) => {
    console.error('Failed to enroll member: ' + err);
});

