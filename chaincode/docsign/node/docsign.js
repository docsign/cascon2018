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

  async queryDoc(stub, args) {
    if (args.length != 1) {
      throw new Error('Incorrect number of arguments. Expecting the combined hash&signature as the key');
    }
    let record = args[0];

    let status = await stub.getState(record);
    if (!status || status.toString().length <= 0) {
      throw new Error('The query record does not exist. The key is: ' + record);
    }
    console.log(status.toString());
    return status;  // should return true
  }

  async initLedger(stub, args) {
    // To simplify the logic, just use the combined (doc_hash + signature) as the key
    // The key is processed in the client side and server side application
    console.info('============= START : Initialize Ledger ===========');
    let docs = [];
    let docHashAndSign = 'dummy doc hash and signature now'
    docs.push({
      existing: 'true'
    });

    for (let i = 0; i < docs.length; i++) {
      await stub.putState(docHashAndSign, Buffer.from(JSON.stringify(docs[i])));
      console.info('Added <--> doc ', i);
    }
    console.info('============= END : Initialize Ledger ===========');
  }

  async createDocAndSign(stub, args) {
    console.info('============= START : Create New Doc Record ===========');
    if (args.length != 1) {
      throw new Error('Incorrect number of arguments. Expecting a single hash&sign as the key.');
    }

    var doc = {
      existing: 'true'
    };

    await stub.putState(args[0], Buffer.from(JSON.stringify(doc)));
    console.info('============= END : Create New Record ===========');
  }

  // async queryAllCars(stub, args) {

  //   let startKey = 'CAR0';
  //   let endKey = 'CAR999';

  //   let iterator = await stub.getStateByRange(startKey, endKey);

  //   let allResults = [];
  //   while (true) {
  //     let res = await iterator.next();

  //     if (res.value && res.value.value.toString()) {
  //       let jsonRes = {};
  //       console.log(res.value.value.toString('utf8'));

  //       jsonRes.Key = res.value.key;
  //       try {
  //         jsonRes.Record = JSON.parse(res.value.value.toString('utf8'));
  //       } catch (err) {
  //         console.log(err);
  //         jsonRes.Record = res.value.value.toString('utf8');
  //       }
  //       allResults.push(jsonRes);
  //     }
  //     if (res.done) {
  //       console.log('end of data');
  //       await iterator.close();
  //       console.info(allResults);
  //       return Buffer.from(JSON.stringify(allResults));
  //     }
  //   }
  // }

  // async changeCarOwner(stub, args) {
  //   console.info('============= START : changeCarOwner ===========');
  //   if (args.length != 2) {
  //     throw new Error('Incorrect number of arguments. Expecting 2');
  //   }

  //   let carAsBytes = await stub.getState(args[0]);
  //   let car = JSON.parse(carAsBytes);
  //   car.owner = args[1];

  //   await stub.putState(args[0], Buffer.from(JSON.stringify(car)));
  //   console.info('============= END : changeCarOwner ===========');
  // }
};

shim.start(new Chaincode());
