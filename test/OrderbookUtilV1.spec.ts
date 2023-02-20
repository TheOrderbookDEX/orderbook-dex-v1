import { DefaultOverrides } from '@frugalwizard/abi2ts-lib';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);

DefaultOverrides.gasLimit = 5000000;

describe('OrderbookUtilV1', function() {
    // TODO test OrderbookUtilV1 library
});
