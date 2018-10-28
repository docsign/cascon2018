/*
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
*/

'use strict';
const shim = require('fabric-shim');
const util = require('util');

let Chaincode = class {

  // The Init method is called when the Smart Contract 'docsign' is instantiated by the blockchain network
  // Best practice is to have any Ledger initialization in separate function -- see initLedger()
  async Init(stub) {
    console.info('=========== Instantiated docsign chaincode ===========');
    return shim.success();
  }

  // The Invoke method is called as a result of an application request to run the Smart Contract
  // 'docsign'. The calling application program has also specified the particular smart contract
  // function to be called, with arguments
  async Invoke(stub) {
    let ret = stub.getFunctionAndParameters();
    console.info(ret);

    let method = this[ret.fcn];
    if (!method) {
      console.error('no function of name:' + ret.fcn + ' found');
      throw new Error('Received unknown function ' + ret.fcn + ' invocation');
    }
    try {
      let payload = await method(stub, ret.params);
      return shim.success(payload);
    } catch (err) {
      console.log(err);
      return shim.error(err);
    }
  }

  async get(stub, args) {
    if (args.length != 1) {
      throw new Error('Incorrect number of arguments. Expecting one key.');
    }
    let record = args[0];

    let status = await stub.getState(record);
    if (!status || status.toString().length <= 0) {
      throw new Error('The query record does not exist. The key is: ' + record);
    }
    console.log(status.toString());
    return status;  // should return true
  }

  async put(stub, args) {
    console.info('============= START : Create New Record ===========');
    if (args.length != 2) {
      throw new Error('Incorrect number of arguments. Expecting a key and a value.');
    }

    await stub.putState(args[0], Buffer.from(JSON.stringify(args[1])));
    console.info('============= END : Create New Record ===========');
  }
};

shim.start(new Chaincode());
