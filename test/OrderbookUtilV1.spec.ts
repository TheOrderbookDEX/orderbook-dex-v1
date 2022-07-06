import DefaultOverrides from 'abi2ts-lib/dist/default-overrides';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);

DefaultOverrides.gasLimit = 5000000;

describe('OrderbookUtilV1', function() {
    // TODO test OrderbookUtilV1 library
});
